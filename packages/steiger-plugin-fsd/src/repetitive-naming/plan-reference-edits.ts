import * as fs from 'node:fs'
import { sep } from 'node:path'
import { findAllRecursively } from '@steiger/toolkit'
import type { File, Folder, TextEdit } from '@steiger/toolkit'
import type { TSConfckParseResult } from 'tsconfck'

import { resolveDependency } from '../_lib/resolve-dependency.js'
import { extractDependencies, getSourceType } from '../_language-tools/index.js'
import type { SliceRename } from './plan-renames.js'

/** Text edits to make in one source file, keyed by the absolute path of that file. */
type ReferenceEdits = Record<string, Array<TextEdit>>

/**
 * Rewrite every module specifier that points into one of the renamed slices.
 *
 * Only the path segment that names the slice is replaced, and only after the specifier has been
 * resolved through the project's TypeScript configuration to prove that it really does point at that
 * slice. Plain strings, comments and route paths are never touched, because the specifiers come from
 * the parsed syntax tree rather than from a text search.
 *
 * @returns the edits to make, or `null` if any reference can't be rewritten with confidence. In that
 * case no fix is offered at all, since a half-rewritten project is worse than an unfixed one.
 */
export async function planReferenceEdits(
  root: Folder,
  renames: Array<SliceRename>,
  tsConfigs: Array<TSConfckParseResult['tsconfig']>,
): Promise<ReferenceEdits | null> {
  const renameByPath = new Map(renames.map((rename) => [rename.path, rename]))
  const oldNames = new Set(renames.map((rename) => rename.oldName))
  const edits: ReferenceEdits = {}

  for (const sourceFile of collectSourceFiles(root)) {
    let dependencies: Awaited<ReturnType<typeof extractDependencies>>
    let source: string
    try {
      dependencies = await extractDependencies(sourceFile.path, { includeReExports: true })
      source = fs.readFileSync(sourceFile.path, 'utf8')
    } catch {
      // A file we can't read or parse is a file whose references we can't vouch for.
      return null
    }

    if (dependencies.length === 0) {
      continue
    }

    const lineOffsets = getLineOffsets(source)

    for (const dependency of dependencies) {
      const resolvedDependency = resolveDependency(
        dependency.path,
        sourceFile.path,
        tsConfigs,
        fs.existsSync,
        fs.existsSync,
      )

      if (resolvedDependency === null) {
        // We can't tell where this one points. If it even mentions a slice we're about to rename,
        // we have to assume it might break.
        if (segmentsOf(dependency.path).some((segment) => oldNames.has(segment))) {
          return null
        }
        continue
      }

      const rename = findRename(renameByPath, resolvedDependency)
      if (rename === undefined) {
        continue
      }

      const start = toOffset(lineOffsets, dependency.start.line, dependency.start.column)
      const end = toOffset(lineOffsets, dependency.end.line, dependency.end.column)

      // The specifier in the source has to be literally the string we matched against, otherwise
      // (escape sequences, template-like syntax) the offsets we compute wouldn't mean anything.
      if (start === null || end === null || source.slice(start, end) !== dependency.path) {
        return null
      }

      const segmentIndexes = findSegmentIndexes(dependency.path, rename.oldName)

      if (segmentIndexes.length === 0) {
        // The specifier doesn't spell out the slice name at all. For a file inside the slice itself
        // that's expected: the whole folder moves together, so its relative paths survive the rename.
        // From anywhere else it means we don't understand the reference well enough to touch it.
        if (isInside(sourceFile.path, rename.path)) {
          continue
        }

        return null
      }

      if (segmentIndexes.length > 1) {
        // With the name appearing more than once, there's no telling which occurrence is the slice.
        return null
      }

      const offsetInSpecifier = segmentOffset(dependency.path, segmentIndexes[0])

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

function findRename(renameByPath: Map<string, SliceRename>, resolvedDependency: string): SliceRename | undefined {
  for (const [slicePath, rename] of renameByPath) {
    if (isInside(resolvedDependency, slicePath)) {
      return rename
    }
  }

  return undefined
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

  test('toOffset converts parser positions', () => {
    const source = 'first\nsecond\n'
    const lineOffsets = getLineOffsets(source)
    expect(toOffset(lineOffsets, 1, 1)).toBe(0)
    expect(toOffset(lineOffsets, 2, 1)).toBe(6)
    expect(toOffset(lineOffsets, 2, 3)).toBe(8)
  })
}
