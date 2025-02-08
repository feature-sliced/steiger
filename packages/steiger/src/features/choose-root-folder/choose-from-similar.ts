import { readdir } from 'node:fs/promises'
import { parse, relative, sep, join, dirname } from 'node:path'
import pc from 'picocolors'
import { isGitIgnored } from 'globby'
import * as find from 'empathic/find'

import { distance } from 'fastest-levenshtein'
import { isCancel, outro, select, confirm } from '@clack/prompts'
import { formatCommand } from './format-command'
import { ExitException } from '../../shared/exit-exception'

/** The maximum Levenshtein distance between the input and the reference for the input to be considered a typo. */
const typoThreshold = 5
const gitFolder = find.up('.git')
const isIgnored = await isGitIgnored({ cwd: gitFolder ? dirname(gitFolder) : undefined })

/** Present the user with a choice of folders based on similarity to a given input. */
export async function chooseFromSimilar(input: string): Promise<string> {
  const resolved = relative('.', input)
  const { dir, base } = parse(resolved)
  const existingDir = await resolveWithCorrections(dir || '.')

  const candidates = (await readdir(existingDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name !== '.git' && !isIgnored(join(existingDir, entry.name)))
    .map((entry) => entry.name)
  const withDistances = candidates.map((candidate) => [candidate, distance(candidate, base)] as const)
  const suggestions = withDistances
    .filter(([_candidate, distance]) => distance <= typoThreshold)
    .sort((a, b) => a[1] - b[1])

  let answer: string | undefined
  if (suggestions.length === 1) {
    const confirmation = await confirm({
      message: `${pc.red(input)} is not a folder. Did you mean ${pc.green(`.${sep}${join(existingDir, suggestions[0][0])}`)}?`,
      inactive: 'No, exit',
    })

    if (confirmation === true) {
      answer = join(existingDir, suggestions[0][0])
    } else {
      answer = ''
    }
  } else {
    const selection = await select({
      message: `${pc.red(input)} is not a folder. Did you mean one of the following?`,
      options: suggestions
        .map(([candidate, _distance]) => ({ value: candidate, label: `.${sep}${join(existingDir, candidate)}` }))
        .concat({ value: '', label: 'No, exit' }),
    })

    if (selection !== '' && !isCancel(selection)) {
      answer = join(existingDir, selection)
    } else {
      answer = ''
    }
  }

  if (answer !== '') {
    outro(`Running ${formatCommand(`steiger .${sep}${answer}`)}`)
    return answer
  } else {
    outro(`Alright! To run checks on a specific folder, run ${formatCommand(`steiger .${sep}your-folder`)}.`)
    throw new ExitException()
  }
}

/**
 * Take a relative path that might contain typos and resolve each typo to the best matching candidate.
 *
 * @example
 * // For a folder structure like:
 * // - src
 * //   - app
 * //   - shared
 * // - dist
 * resolveWithCorrections('src/app')  // 'src/app'
 * resolveWithCorrections('scr/shad')  // 'src/shared'
 */
async function resolveWithCorrections(path: string) {
  let finalPath = '.'
  for (const part of path.split(sep)) {
    if (part === '.') {
      continue
    } else if (part === '..') {
      finalPath = join(finalPath, part)
    } else {
      const candidates = (await readdir(finalPath, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
      const distances = candidates.map((candidate) => distance(candidate, part))
      const bestMatch = candidates[distances.indexOf(Math.min(...distances))]
      finalPath = join(finalPath, bestMatch)
    }
  }

  return finalPath
}

if (import.meta.vitest) {
  const { test, expect, vi } = import.meta.vitest
  const { vol } = await import('memfs')
  const { joinFromRoot } = await import('@steiger/toolkit/test')

  vi.mock('node:fs/promises', () => import('memfs').then((memfs) => memfs.fs.promises))

  test('resolveWithCorrections', async () => {
    const root = joinFromRoot('home', 'project')
    const fileStructure = {
      src: {
        app: {},
        shared: {},
      },
      dist: {},
    }

    vi.spyOn(process, 'cwd').mockReturnValue(root)
    vol.fromNestedJSON(fileStructure, root)

    expect(await resolveWithCorrections(join('src', 'app'))).toBe(join('src', 'app'))
    expect(await resolveWithCorrections(join('scr', 'shad'))).toBe(join('src', 'shared'))
  })
}
