import { dirname, join, sep } from 'node:path'
import { rename, open, mkdir, rm, readFile, writeFile } from 'node:fs/promises'
import type { Fix, PartialDiagnostic, TextEdit } from '@steiger/types'
import { applyTextEdits, textEditsOverlap } from '@steiger/toolkit'

export async function applyAutofixes<T extends PartialDiagnostic>(diagnostics: Array<T>): Promise<T[]> {
  const stillRelevantDiagnostics = []
  const fixableDiagnostics = []

  for (const diagnostic of diagnostics) {
    const fixes = diagnostic.fixes

    if (!fixes) {
      // If we don't know how to fix, it's relevant right away
      stillRelevantDiagnostics.push(diagnostic)
      continue
    }

    fixableDiagnostics.push(diagnostic)
  }

  try {
    await applyFixes(fixableDiagnostics.flatMap((diagnostic) => diagnostic.fixes ?? []))
  } catch (error) {
    // If for some reason, a fix failed
    // then assume the diagnostics are still relevant
    // TODO: enhance it to push only failed fixes instead of all
    stillRelevantDiagnostics.push(...fixableDiagnostics)
    console.error(error)
  }

  return stillRelevantDiagnostics
}

/**
 * Apply all fixes of a single Steiger run.
 *
 * Fixes are applied in phases rather than all at once, because they are not independent:
 *  - files have to exist before their contents are edited;
 *  - files have to be edited before the folders containing them are renamed, otherwise the paths in the
 *    edits would point at folders that no longer exist;
 *  - deletions come last so that they don't remove anything another fix still needs.
 *
 * Within a phase, fixes are independent and are applied concurrently.
 *
 * Combinations of fixes that this ordering cannot make sense of (see {@link rejectConflictingFixes})
 * are rejected before anything runs, so a conflicting set of fixes leaves the project untouched.
 * The phases themselves are *not* a transaction, however: if a fix fails midway (say, a rename is
 * denied by the file system), the phases before it have already been applied and stay applied.
 */
async function applyFixes(fixes: Array<Fix>) {
  const byType = <Type extends Fix['type']>(type: Type) =>
    fixes.filter((fix): fix is Extract<Fix, { type: Type }> => fix.type === type)

  const editsByPath = groupEditsByPath(byType('edit-file'))
  rejectConflictingFixes(fixes, editsByPath)

  await Promise.all(byType('create-folder').map((fix) => mkdir(fix.path, { recursive: true })))
  await Promise.all(byType('create-file').map((fix) => open(fix.path, 'w').then((file) => file.close())))
  await Promise.all(
    byType('modify-file').map((fix) =>
      open(fix.path, 'w').then(async (file) => {
        await file.write(fix.content)
        return file.close()
      }),
    ),
  )
  await Promise.all(
    Object.entries(editsByPath).map(async ([path, edits]) => {
      const source = await readFile(path, 'utf8')
      return writeFile(path, applyTextEdits(source, edits))
    }),
  )
  // Renames are applied deepest-first so that renaming a folder never invalidates the path of a
  // rename that was meant to happen inside it.
  for (const fix of dedupeRenames(byType('rename')).sort((a, b) => depth(b.path) - depth(a.path))) {
    await rename(fix.path, join(dirname(fix.path), fix.newName))
  }
  await Promise.all(byType('delete').map((fix) => rm(fix.path, { recursive: true })))
}

/**
 * Refuse combinations of fixes whose result would be ambiguous or corrupted, before any of them runs.
 *
 * The rejected combinations, all concerning one and the same path:
 *  - `edit-file` together with `modify-file` or `create-file`. The edit offsets are measured against
 *    the file as it is now, and both of the others replace that content wholesale.
 *  - More than one `modify-file`. Each one carries the whole content of the file, so only one of them
 *    could survive.
 *  - `delete` together with anything else. There is no point in changing a file that is about to go
 *    away, and deleting something another fix still needs would break that fix.
 *  - Several `rename`s of the same path to different names.
 *  - `edit-file` edits that turn out to overlap once merged across diagnostics.
 *
 * Renames are also checked against each other across paths. Two renames must not produce the same
 * destination, and no rename may target the source of another one, because the result of either would
 * depend on the order the renames happen to run in.
 *
 * Destinations are compared as written. Names that collide only on a case-insensitive file system are
 * left to the rule that produced the fixes, since the executor has no way to tell how the file system
 * it is writing to compares paths.
 *
 * @throws when such a combination is found; the caller treats it like any other failed fix and keeps
 * the diagnostics as still relevant.
 */
function rejectConflictingFixes(fixes: Array<Fix>, editsByPath: Record<string, Array<TextEdit>>) {
  const fixesByPath = new Map<string, Array<Fix>>()
  for (const fix of fixes) {
    const fixesAtPath = fixesByPath.get(fix.path) ?? []
    fixesAtPath.push(fix)
    fixesByPath.set(fix.path, fixesAtPath)
  }

  for (const [path, fixesAtPath] of fixesByPath) {
    if (fixesAtPath.length < 2) continue

    const types = new Set(fixesAtPath.map((fix) => fix.type))
    const conflict = (reason: string) => new Error(`Conflicting fixes for "${path}": ${reason}.`)

    if (types.has('delete')) {
      throw conflict('it is slated for deletion, but other fixes still want to change it')
    }
    if (types.has('edit-file') && (types.has('modify-file') || types.has('create-file'))) {
      throw conflict('its content would be replaced, invalidating the text edits made to it')
    }
    if (fixesAtPath.filter((fix) => fix.type === 'modify-file').length > 1) {
      throw conflict('several fixes each claim to know its final content')
    }

    const newNames = new Set(fixesAtPath.flatMap((fix) => (fix.type === 'rename' ? [fix.newName] : [])))
    if (newNames.size > 1) {
      throw conflict(`several fixes want to rename it differently (${[...newNames].join(', ')})`)
    }
  }

  for (const [path, edits] of Object.entries(editsByPath)) {
    if (textEditsOverlap(edits)) {
      throw new Error(`Conflicting fixes for "${path}": the text edits made to it overlap.`)
    }
  }

  const renames = dedupeRenames(fixes.filter((fix): fix is Extract<Fix, { type: 'rename' }> => fix.type === 'rename'))
  const sources = new Set(renames.map((fix) => fix.path))
  const claimedDestinations = new Map<string, string>()

  for (const fix of renames) {
    const destination = join(dirname(fix.path), fix.newName)
    if (destination === fix.path) {
      continue
    }

    const claimedBy = claimedDestinations.get(destination)
    if (claimedBy !== undefined) {
      throw new Error(`Conflicting fixes: both "${claimedBy}" and "${fix.path}" would be renamed to "${destination}".`)
    }
    claimedDestinations.set(destination, fix.path)

    if (sources.has(destination)) {
      throw new Error(
        `Conflicting fixes: "${fix.path}" would be renamed to "${destination}", which another fix renames as well.`,
      )
    }
  }
}

/**
 * Merge the edits that several diagnostics want to make in the same file into a single set of edits.
 *
 * Without this, two diagnostics editing the same file would race and one of them would be lost.
 */
function groupEditsByPath(fixes: Array<Extract<Fix, { type: 'edit-file' }>>): Record<string, Array<TextEdit>> {
  const grouped: Record<string, Array<TextEdit>> = {}

  for (const fix of fixes) {
    grouped[fix.path] ??= []
    grouped[fix.path].push(...fix.edits)
  }

  return grouped
}

/** Two diagnostics asking for the very same rename agree with each other, so the rename runs once. */
function dedupeRenames(fixes: Array<Extract<Fix, { type: 'rename' }>>): Array<Extract<Fix, { type: 'rename' }>> {
  const seen = new Set<string>()

  return fixes.filter((fix) => {
    const key = `${fix.path}\0${fix.newName}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function depth(path: string) {
  return path.split(sep).length
}
