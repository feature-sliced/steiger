import * as fs from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { findAllRecursively } from '@steiger/toolkit'
import type { File, Folder, TextEdit } from '@steiger/toolkit'
import type { TSConfckParseResult } from 'tsconfck'

import { resolveDependency } from '../_lib/resolve-dependency.js'
import { analyzeModule, getSourceType } from '../_language-tools/index.js'
import type { Statement } from '../_language-tools/index.js'
import type { SliceRename } from './plan-renames.js'

/** Text edits to make in one source file, keyed by the absolute path of that file. */
type ReferenceEdits = Record<string, Array<TextEdit>>

/**
 * Rewrite every module specifier that would stop pointing at its file once the slices are renamed.
 *
 * References are judged by the file they resolve to through the project's TypeScript configuration.
 * A specifier that still resolves to the same file after the renames (like `./ui/HomePage` inside the
 * `HomePage` slice) is left as it is. Otherwise, one path segment that names a renamed slice gets the
 * new name, and only if exactly one such rewrite resolves to the same file again. Plain strings,
 * comments and route paths are never touched, because the specifiers come from the parsed syntax tree
 * rather than from a text search.
 *
 * @returns the edits to make, or `null` if any reference can't be rewritten with confidence. In that
 * case no fix is offered at all, since a half-rewritten project is worse than an unfixed one.
 */
export async function planReferenceEdits(
  root: Folder,
  renames: Array<SliceRename>,
  tsConfigs: Array<TSConfckParseResult['tsconfig']>,
): Promise<ReferenceEdits | null> {
  const oldNames = new Set(renames.map((rename) => rename.oldName))
  const renamed = simulateRenames(renames)
  const edits: ReferenceEdits = {}

  for (const sourceFile of collectSourceFiles(root)) {
    let references: Array<Statement>
    let source: string
    try {
      // A renamed slice can be reached through an import or a re-export, never through a built-in
      // module.
      const { statements } = await analyzeModule(sourceFile.path)
      references = statements.filter((statement) => !statement.builtIn)
      source = fs.readFileSync(sourceFile.path, 'utf8')
    } catch {
      // If we can't read or parse a file, we can't vouch for its references.
      return null
    }

    if (references.length === 0) {
      continue
    }

    const lineOffsets = getLineOffsets(source)

    for (const reference of references) {
      const resolvedDependency = resolveDependency(
        reference.source,
        sourceFile.path,
        tsConfigs,
        fs.existsSync,
        fs.existsSync,
      )

      if (resolvedDependency === null) {
        // We can't tell where this one points. If it even mentions a slice we're about to rename,
        // we have to assume it might break.
        if (segmentsOf(reference.source).some((segment) => oldNames.has(segment))) {
          return null
        }
        continue
      }

      const importerAfterRenames = renamed.move(sourceFile.path)
      const targetAfterRenames = renamed.move(resolvedDependency)

      if (importerAfterRenames === sourceFile.path && targetAfterRenames === resolvedDependency) {
        // Neither end of the reference moves, so it keeps working as it is.
        continue
      }

      const resolvesToTarget = (specifier: string) =>
        resolveDependency(specifier, importerAfterRenames, tsConfigs, renamed.exists, renamed.exists) ===
        targetAfterRenames

      if (resolvesToTarget(reference.source)) {
        // Typically a relative path inside a renamed slice: the whole folder moves together.
        continue
      }

      const start = toOffset(lineOffsets, reference.sourceRange.start.line, reference.sourceRange.start.column)
      const end = toOffset(lineOffsets, reference.sourceRange.end.line, reference.sourceRange.end.column)

      // The specifier in the source has to be literally the string we matched against, otherwise
      // (escape sequences, template-like syntax) the offsets we compute wouldn't mean anything.
      if (start === null || end === null || source.slice(start, end) !== reference.source) {
        return null
      }

      const rewrites = candidateRewrites(reference.source, renames).filter((rewrite) =>
        resolvesToTarget(rewrite.specifier),
      )

      if (rewrites.length !== 1) {
        // Either no rewrite leads back to the same file, or several do and there's no telling which
        // one is meant. Either way, we don't understand the reference well enough to touch it.
        return null
      }

      const [{ rename, segmentIndex }] = rewrites
      const offsetInSpecifier = segmentOffset(reference.source, segmentIndex)

      edits[sourceFile.path] ??= []
      edits[sourceFile.path].push({
        start: start + offsetInSpecifier,
        end: start + offsetInSpecifier + rename.oldName.length,
        replacement: rename.newName,
      })
    }
  }

  return edits
}

/**
 * Describe the project as it will be once the slices are renamed, in terms of the project as it is now.
 */
function simulateRenames(renames: Array<SliceRename>) {
  const moves = renames.map((rename) => ({ from: rename.path, to: join(dirname(rename.path), rename.newName) }))

  // TypeScript's module resolution calls `exists` with forward slashes on every OS, while the moves are
  // written with the OS separator. On Windows the two would never compare equal without this.
  const toOsPath = (path: string) => path.replace(/\//g, sep)

  return {
    /** Where something that is at this path now will be after the renames. */
    move(rawPath: string): string {
      const path = toOsPath(rawPath)
      const move = moves.find(({ from }) => isInside(path, from))
      return move === undefined ? path : move.to + path.slice(move.from.length)
    },
    /** Whether anything will be at this path after the renames. */
    exists(rawPath: string): boolean {
      const path = toOsPath(rawPath)
      const moveInto = moves.find(({ to }) => isInside(path, to))
      if (moveInto !== undefined) {
        return fs.existsSync(moveInto.from + path.slice(moveInto.to.length))
      }

      // Everything inside a renamed folder moves out of it.
      if (moves.some(({ from }) => isInside(path, from))) {
        return false
      }

      return fs.existsSync(path)
    },
  }
}

/** Every way to point a specifier at a renamed slice by giving one of its path segments the new name. */
function candidateRewrites(specifier: string, renames: Array<SliceRename>) {
  return renames.flatMap((rename) =>
    findSegmentIndexes(specifier, rename.oldName).map((segmentIndex) => ({
      rename,
      segmentIndex,
      specifier: replaceSegment(specifier, segmentIndex, rename.newName),
    })),
  )
}

/** Check whether a path points at a file inside a folder, or at the folder itself. */
function isInside(path: string, folderPath: string): boolean {
  return path === folderPath || path.startsWith(folderPath + sep)
}

/** Module specifiers always use forward slashes, no matter what the host file system does. */
function segmentsOf(specifier: string): Array<string> {
  return specifier.split('/')
}

/** Find the positions (as segment indexes) at which a module specifier names the given folder. */
function findSegmentIndexes(specifier: string, segmentName: string): Array<number> {
  return segmentsOf(specifier).flatMap((segment, index) => (segment === segmentName ? [index] : []))
}

/** Replace the segment with the given index in a module specifier. */
function replaceSegment(specifier: string, segmentIndex: number, replacement: string): string {
  return segmentsOf(specifier)
    .map((segment, index) => (index === segmentIndex ? replacement : segment))
    .join('/')
}

/** Compute the character offset at which the segment with the given index starts in the specifier. */
function segmentOffset(specifier: string, segmentIndex: number): number {
  // Every preceding segment contributes its length plus the slash that follows it.
  return segmentsOf(specifier)
    .slice(0, segmentIndex)
    .reduce((offset, segment) => offset + segment.length + 1, 0)
}

/**
 * All the files that the reference scan needs to look at.
 *
 * This walks the whole tree instead of using `indexSourceFiles`, which only covers files in recognized
 * layers and slices. Any file in the project can import a slice, a root-level entrypoint included, and
 * all of their imports have to keep working.
 */
function collectSourceFiles(root: Folder): Array<File> {
  return findAllRecursively(
    root,
    (entry) => entry.type === 'file' && getSourceType(entry.path) !== undefined,
  ) as Array<File>
}

/** Offsets at which each line of the source starts. */
function getLineOffsets(source: string): Array<number> {
  const offsets = [0]

  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n') {
      offsets.push(i + 1)
    }
  }

  return offsets
}

/** Convert a 1-based line and column, as reported by the parser, into an offset into the source. */
function toOffset(lineOffsets: Array<number>, line: number, column: number): number | null {
  const lineStart = lineOffsets[line - 1]
  if (lineStart === undefined) {
    return null
  }

  return lineStart + (column - 1)
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest

  test('findSegmentIndexes and segmentOffset locate exact segments', () => {
    expect(findSegmentIndexes('@/pages/homePage', 'homePage')).toEqual([2])
    expect(segmentOffset('@/pages/homePage', 2)).toBe(8)
    expect(findSegmentIndexes('../homePage/ui', 'homePage')).toEqual([1])
    expect(segmentOffset('../homePage/ui', 1)).toBe(3)
    expect(findSegmentIndexes('homePage', 'homePage')).toEqual([0])
    expect(segmentOffset('homePage', 0)).toBe(0)
  })

  test('findSegmentIndexes distinguishes missing from ambiguous segments', () => {
    expect(findSegmentIndexes('@/pages/homePage/homePage', 'homePage')).toEqual([2, 3])
    expect(findSegmentIndexes('homePage/homePage', 'homePage')).toEqual([0, 1])
    expect(findSegmentIndexes('@/pages/home', 'homePage')).toEqual([])
    // A partial match inside a longer segment is not a match at all.
    expect(findSegmentIndexes('@/pages/homePageExtra', 'homePage')).toEqual([])
  })

  test('replaceSegment replaces exactly one segment', () => {
    expect(replaceSegment('@/pages/homePage/ui/homePage', 2, 'home')).toBe('@/pages/home/ui/homePage')
    expect(replaceSegment('../homePage', 1, 'home')).toBe('../home')
  })

  test('toOffset converts parser positions', () => {
    const source = 'first\nsecond\n'
    const lineOffsets = getLineOffsets(source)
    expect(toOffset(lineOffsets, 1, 1)).toBe(0)
    expect(toOffset(lineOffsets, 2, 1)).toBe(6)
    expect(toOffset(lineOffsets, 2, 3)).toBe(8)
  })
}
