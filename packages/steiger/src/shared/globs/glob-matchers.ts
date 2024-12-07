import { isNegatedGlob } from './utilities'
import { minimatch } from 'minimatch'

// ! Don't use platform specific path separators in the glob patterns for globby/minimatch
// as it only works with forward slashes!

interface ApplyGlobsOptions {
  inclusions?: string[]
  exclusions?: string[]
}

export function createFilterAccordingToGlobs({ inclusions, exclusions }: ApplyGlobsOptions) {
  const thereAreInclusions = Array.isArray(inclusions)
  const thereAreExclusions = Array.isArray(exclusions)
  const inclusionsEmpty = thereAreInclusions && inclusions.length === 0

  function filterAccordingToGlobs(path: string) {
    const matchesInclusionPatterns = !thereAreInclusions || inclusions.some((pattern) => minimatch(path, pattern))
    let isIgnored = false

    if (inclusionsEmpty) {
      return false
    }

    if (matchesInclusionPatterns && thereAreExclusions) {
      isIgnored = exclusions.filter((pattern) => !isNegatedGlob(pattern)).some((pattern) => minimatch(path, pattern))

      // If the path is ignored, check for any negated patterns that would include it back
      if (isIgnored) {
        const isNegated = exclusions.some(
          (ignorePattern) => isNegatedGlob(ignorePattern) && minimatch(path, ignorePattern.slice(1)),
        )

        isIgnored = !isNegated
      }
    }

    return matchesInclusionPatterns && !isIgnored
  }

  return filterAccordingToGlobs
}

/**
 * Checks if a file/folder is a well-known ignore.
 *
 * If a path does not match the "any file/folder" pattern, it is considered a well-known ignore.
 * It looks like minimatch has some registry of such files, and it returns false for them regardless of the pattern.
 * It's the case for .DS_Store on macOS. Maybe there are other cases.
 * */
export function isWellKnownIgnore(path: string) {
  return !minimatch(path, '**')
}
