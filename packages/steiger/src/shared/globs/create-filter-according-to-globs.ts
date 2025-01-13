import { isNegatedGlob } from './utilities'
import micromatch from 'micromatch'

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
    const matchesInclusionPatterns =
      !thereAreInclusions || inclusions.some((pattern) => micromatch.isMatch(path, pattern))
    let isIgnored = false

    if (inclusionsEmpty) {
      return false
    }

    if (matchesInclusionPatterns && thereAreExclusions) {
      isIgnored = exclusions
        .filter((pattern) => !isNegatedGlob(pattern))
        .some((pattern) => micromatch.isMatch(path, pattern))

      // If the path is ignored, check for any negated patterns that would include it back
      if (isIgnored) {
        const isNegated = exclusions.some(
          (ignorePattern) => isNegatedGlob(ignorePattern) && micromatch.isMatch(path, ignorePattern.slice(1)),
        )

        isIgnored = !isNegated
      }
    }

    return matchesInclusionPatterns && !isIgnored
  }

  return filterAccordingToGlobs
}
