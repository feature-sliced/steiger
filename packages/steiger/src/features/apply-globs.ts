import { minimatch } from 'minimatch'
import { File, Folder } from '@steiger/types'

import { isNegationPattern } from '../shared/globs'
import { flattenFolder, copyFsEntity, recomposeTree } from '../shared/file-system'

interface ApplyGlobsOptions {
  inclusions?: string[]
  exclusions?: string[]
}

type RequiredApplyGlobsOptions = Required<ApplyGlobsOptions>

export function createFilterAccordingToGlobs({ inclusions, exclusions }: RequiredApplyGlobsOptions) {
  const thereAreInclusions = inclusions.length > 0
  const thereAreExclusions = exclusions.length > 0

  function filterAccordingToGlobs(entity: File | Folder) {
    const matchesInclusionPatterns =
      !thereAreInclusions || inclusions.some((pattern) => minimatch(entity.path, pattern))
    let isIgnored = false

    if (matchesInclusionPatterns && thereAreExclusions) {
      isIgnored = exclusions
        .filter((pattern) => !isNegationPattern(pattern))
        .some((pattern) => minimatch(entity.path, pattern))

      // If the path is ignored, check for any negated patterns that would include it back
      if (isIgnored) {
        const isNegated = exclusions.some(
          (ignorePattern) => isNegationPattern(ignorePattern) && minimatch(entity.path, ignorePattern.slice(1)),
        )

        isIgnored = !isNegated
      }
    }

    return matchesInclusionPatterns && !isIgnored
  }

  return filterAccordingToGlobs
}

// ! Don't use platform specific path separators in the glob patterns for globby/minimatch
// as it only works with forward slashes!

/**
 * Apply glob patterns to a folder and return a new folder with only the matched files and folders.
 * */
export default function applyGlobs(folder: Folder, { inclusions = [], exclusions = [] }: ApplyGlobsOptions) {
  // if there's nothing to match then return the folder as is
  if (!inclusions?.length && !exclusions?.length) {
    return folder
  }

  const accordingToGlobs = createFilterAccordingToGlobs({ inclusions, exclusions })
  const flatFilteredFsNodes = flattenFolder(folder)
    .map((entity) => copyFsEntity(entity))
    .filter(accordingToGlobs)
  const finalFolder = copyFsEntity(folder)

  recomposeTree(finalFolder, flatFilteredFsNodes)

  return finalFolder
}
