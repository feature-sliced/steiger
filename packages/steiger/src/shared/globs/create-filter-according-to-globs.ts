import { isNegatedGlob } from './utilities'
import picomatch from 'picomatch'

// ! Don't use platform specific path separators in the glob patterns for globby/picomatch
// as it only works with forward slashes!

interface ApplyGlobsOptions {
  inclusions?: string[]
  exclusions?: string[]
}

export function createFilterAccordingToGlobs({ inclusions, exclusions }: ApplyGlobsOptions) {
  const thereAreInclusions = Array.isArray(inclusions)
  const thereAreExclusions = Array.isArray(exclusions)
  const inclusionsEmpty = thereAreInclusions && inclusions.length === 0

  const isIncluded = thereAreInclusions ? picomatch(inclusions) : () => true

  const positiveExclusionPatterns =
    (thereAreExclusions && exclusions.filter((pattern) => !isNegatedGlob(pattern))) || []
  const negativeExclusionPatterns =
    (thereAreExclusions && exclusions.filter((pattern) => isNegatedGlob(pattern)).map((pattern) => pattern.slice(1))) ||
    []

  const isPositivelyExcluded = picomatch(positiveExclusionPatterns)
  const isReIncluded = picomatch(negativeExclusionPatterns)

  function filterAccordingToGlobs(path: string) {
    if (inclusionsEmpty) {
      return false
    }

    const matchesInclusionPatterns = isIncluded(path)
    let isIgnored = false

    if (matchesInclusionPatterns && thereAreExclusions) {
      isIgnored = isPositivelyExcluded(path) && !isReIncluded(path)
    }

    return matchesInclusionPatterns && !isIgnored
  }

  return filterAccordingToGlobs
}
