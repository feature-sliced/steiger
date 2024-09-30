import { minimatch } from 'minimatch'

// ! Don't use platform specific path separators in the glob patterns for globby/minimatch
// as it only works with forward slashes!

interface ApplyGlobsOptions {
  inclusions?: string[]
  exclusions?: string[]
}

export function isNegationPattern(pattern: string) {
  return pattern.startsWith('!')
}

export function createFilterAccordingToGlobs({ inclusions = [], exclusions = [] }: ApplyGlobsOptions) {
  const thereAreInclusions = inclusions.length > 0
  const thereAreExclusions = exclusions.length > 0

  function filterAccordingToGlobs(path: string) {
    const matchesInclusionPatterns = !thereAreInclusions || inclusions.some((pattern) => minimatch(path, pattern))
    let isIgnored = false

    if (matchesInclusionPatterns && thereAreExclusions) {
      isIgnored = exclusions
        .filter((pattern) => !isNegationPattern(pattern))
        .some((pattern) => minimatch(path, pattern))

      // If the path is ignored, check for any negated patterns that would include it back
      if (isIgnored) {
        const isNegated = exclusions.some(
          (ignorePattern) => isNegationPattern(ignorePattern) && minimatch(path, ignorePattern.slice(1)),
        )

        isIgnored = !isNegated
      }
    }

    return matchesInclusionPatterns && !isIgnored
  }

  return filterAccordingToGlobs
}
