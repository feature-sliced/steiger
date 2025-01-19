import { sep } from 'node:path'
import { confirm, isCancel, outro, select } from '@clack/prompts'

import { formatCommand } from './format-command'
import { existsAndIsFolder } from '../../shared/file-system'
import { ExitException } from '../../shared/exit-exception'

const commonRootFolders = ['src', 'app'].map((folder) => `.${sep}${folder}`)

/** Present the user with a choice of folders based on an informed guess. */
export async function chooseFromGuesses(): Promise<string> {
  let targetPath: string | undefined

  const candidates = await findRootFolderCandidates()
  if (candidates.length === 0) {
    const answer = await confirm({
      message: `You haven't specified a path to check. Would you like to check this folder?`,
      inactive: 'No, exit',
    })

    if (answer === true) {
      targetPath = '.'
    }
  } else {
    const answer = await select({
      message: `You haven't specified a path to check. Would you like to use one of the following?`,
      options: candidates
        .map((candidate) => ({ value: candidate, label: candidate }))
        .concat({ value: '.', label: 'This folder' })
        .concat({ value: '', label: 'No, exit' }),
    })

    if (!isCancel(answer) && answer !== '') {
      targetPath = answer
    }
  }

  if (targetPath === undefined) {
    outro(`Alright! To run checks on a specific folder, run ${formatCommand(`steiger .${sep}your-folder`)}.`)
    throw new ExitException()
  } else {
    outro(`Running ${formatCommand(`steiger ${targetPath}`)}`)
  }

  return targetPath
}

/**
 * Check if any of the common root project folders are present
 * and return a list of the ones that are present.
 */
async function findRootFolderCandidates(): Promise<Array<string>> {
  return (
    await Promise.all(commonRootFolders.map(async (folder) => ((await existsAndIsFolder(folder)) ? folder : undefined)))
  ).filter(Boolean)
}

if (import.meta.vitest) {
  const { describe, test, expect, vi, beforeEach } = import.meta.vitest
  const { vol } = await import('memfs')
  const { joinFromRoot } = await import('@steiger/toolkit')

  vi.mock('node:fs/promises', () => import('memfs').then((memfs) => memfs.fs.promises))

  describe('findRootFolderCandidates', () => {
    const root = joinFromRoot('home', 'project')
    beforeEach(() => {
      vol.reset()
      vi.spyOn(process, 'cwd').mockReturnValue(root)
    })

    test('when src is present, app is not', async () => {
      const fileStructure = {
        src: {},
        dist: {},
      }

      vol.fromNestedJSON(fileStructure, root)

      await expect(findRootFolderCandidates()).resolves.toEqual([`.${sep}src`])
    })

    test('when app is present, src is not', async () => {
      const fileStructure = {
        app: {},
      }

      vol.fromNestedJSON(fileStructure, root)

      await expect(findRootFolderCandidates()).resolves.toEqual([`.${sep}app`])
    })

    test('when both src and app are present', async () => {
      const fileStructure = {
        src: {},
        app: {},
      }

      vol.fromNestedJSON(fileStructure, root)

      await expect(findRootFolderCandidates()).resolves.toEqual([`.${sep}src`, `.${sep}app`])
    })

    test('when neither src nor app are present', async () => {
      const fileStructure = {
        dist: {},
      }

      vol.fromNestedJSON(fileStructure, root)

      await expect(findRootFolderCandidates()).resolves.toEqual([])
    })
  })
}
