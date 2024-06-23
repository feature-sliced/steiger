import { dirname, join } from 'node:path'
import { rename, open, mkdir, rm } from 'node:fs/promises'
import type { Diagnostic } from '@steiger/types'

export async function applyAutofixes(diagnostics: Array<Diagnostic>) {
  return Promise.all(
    diagnostics
      .flatMap((diagnostic) => diagnostic.fixes ?? [])
      .map((fix) => {
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
