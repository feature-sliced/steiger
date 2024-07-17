import { dirname, join } from 'node:path'
import { rename, open, mkdir, rm } from 'node:fs/promises'
import type { Diagnostic } from '@steiger/types'

export async function applyAutofixes<T extends Diagnostic>(diagnostics: Array<T>): Promise<T[]> {
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
    await Promise.all(fixableDiagnostics.map(tryToApplyFixes))
  } catch (error) {
    // If for some reason, a fix failed
    // then assume the diagnostics are still relevant
    // TODO: enhance it to push only failed fixes instead of all
    stillRelevantDiagnostics.push(...fixableDiagnostics)
    console.error(error)
  }

  return stillRelevantDiagnostics
}

async function tryToApplyFixes(diagnostic: Diagnostic) {
  const fixes = diagnostic.fixes ?? []

  return Promise.all(
    fixes.map((fix) => {
      switch (fix.type) {
        case 'rename':
          return rename(fix.path, join(dirname(fix.path), fix.newName))
        case 'create-file':
          return open(fix.path, 'w').then((file) => file.close())
        case 'create-folder':
          return mkdir(fix.path, { recursive: true })
        case 'delete':
          return rm(fix.path, { recursive: true })
        case 'modify-file':
          return open(fix.path, 'w').then(async (file) => {
            await file.write(fix.content)
            return file.close()
          })
      }
    }),
  )
}
