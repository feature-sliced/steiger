import { basename, join } from 'node:path'
import { findAllRecursively } from '@steiger/toolkit'
import type { Folder } from '@steiger/toolkit'

import { stripTrailingWord, wordsIn } from './slice-name-words.js'

export interface SliceRename {
  /** Absolute path of the slice folder as it is now. */
  path: string
  /** The current name of the slice folder (the last path segment). */
  oldName: string
  /** The name the slice folder should get. */
  newName: string
}

export interface RepetitiveWordCandidate {
  /** Absolute path of the folder that holds the slices: the layer itself, or a group inside it. */
  groupPath: string
  /** The lowercased word that repeats in every slice name. */
  word: string
  /** Names of the slices that share the word, as they appear on disk. */
  sliceNames: Array<string>
}

/**
 * Work out how the slices of one group would have to be renamed to get rid of a repetitive word,
 * or decide that it can't be done safely.
 *
 * Only trailing words are handled. A word at the start or in the middle of a name (`userLogin`,
 * `userLogout`, `userProfile`) is left alone: dropping it changes what the slice is called, and there
 * is no one obvious result.
 *
 * @returns the renames to perform, or `null` if this candidate should stay a plain diagnostic.
 */
export function planRenames(candidate: RepetitiveWordCandidate, root: Folder): Array<SliceRename> | null {
  const renames: Array<SliceRename> = []

  for (const sliceName of candidate.sliceNames) {
    // The word must occur exactly once in the name. Cutting one occurrence of two (`homePagePage`)
    // would leave `homePage`, and the group would get reported for the very same word again.
    if (wordsIn(sliceName).filter((word) => word === candidate.word).length !== 1) {
      return null
    }

    const newName = stripTrailingWord(sliceName, candidate.word)

    // The word isn't a suffix in at least one of the slices, so there is no unambiguous rename.
    if (newName === null) {
      return null
    }

    renames.push({ path: join(candidate.groupPath, sliceName), oldName: sliceName, newName })
  }

  if (renames.length === 0) {
    return null
  }

  // Two slices must not end up with names that a case-insensitive file system would consider the same.
  const newNames = renames.map((rename) => rename.newName.toLowerCase())
  if (new Set(newNames).size !== newNames.length) {
    return null
  }

  // A new name must not collide with something that already sits next to the slices and is staying put.
  const renamedNames = new Set(renames.map((rename) => rename.oldName.toLowerCase()))
  const occupiedNames = siblingNames(root, candidate.groupPath).filter((name) => !renamedNames.has(name.toLowerCase()))

  if (newNames.some((newName) => occupiedNames.some((occupied) => occupied.toLowerCase() === newName))) {
    return null
  }

  return renames
}

/** List the names of everything directly inside a folder of the virtual file system. */
function siblingNames(root: Folder, folderPath: string): Array<string> {
  const [folder] = findAllRecursively(root, (entry) => entry.type === 'folder' && entry.path === folderPath)
  return folder?.type === 'folder' ? folder.children.map((child) => basename(child.path)) : []
}

/**
 * Drop the plans of groups that were reported for more than one repetitive word.
 *
 * With two repetitive words in one group, both of them describe the very same slice folders, and
 * there's no telling which one the author meant to get rid of. Removing one would also leave the
 * other one reported. Such groups stay as plain diagnostics.
 */
export function discardAmbiguousPlans<T extends { candidate: RepetitiveWordCandidate }>(
  plans: Array<T>,
  allCandidates: Array<RepetitiveWordCandidate>,
): Array<T> {
  const countPerGroup = new Map<string, number>()

  for (const candidate of allCandidates) {
    countPerGroup.set(candidate.groupPath, (countPerGroup.get(candidate.groupPath) ?? 0) + 1)
  }

  return plans.filter((plan) => countPerGroup.get(plan.candidate.groupPath) === 1)
}
