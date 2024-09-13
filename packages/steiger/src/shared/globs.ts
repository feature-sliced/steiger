import { minimatch } from 'minimatch'

// ! Don't use platform specific path separators in the glob patterns for globby/minimatch
// as it only works with forward slashes!

interface ApplyGlobsOptions {
  inclusions?: string[]
  exclusions?: string[]
}

export type NodeType = 'file' | 'folder'

export function isNegationPattern(pattern: string) {
  return pattern.startsWith('!')
}

// This function is a wrapper around minimatch to be able
// to match the containing folder when the pattern ends with `**`.
// E.g. if the pattern is `/src/shared/**` it should match `/src/shared` as well.
// But it's not the case with default minimatch.
function matchWithContainingFolder(path: string, pattern: string, nodeType: NodeType) {
  const isAllInsideFolderPattern = pattern.endsWith('**')

  const defaultResult = minimatch(path, pattern)

  if (defaultResult) {
    return defaultResult
  }

  // If the default result failed, try to match the containing folder
  if (nodeType === 'folder' && isAllInsideFolderPattern) {
    return minimatch(path, pattern.slice(0, -3))
  }

  return false
}

export function createFilterAccordingToGlobs({ inclusions = [], exclusions = [] }: ApplyGlobsOptions) {
  const thereAreInclusions = inclusions.length > 0
  const thereAreExclusions = exclusions.length > 0

  function filterAccordingToGlobs(path: string, fsEntity: NodeType) {
    const matchesInclusionPatterns =
      !thereAreInclusions || inclusions.some((pattern) => matchWithContainingFolder(path, pattern, fsEntity))
    let isIgnored = false

    if (matchesInclusionPatterns && thereAreExclusions) {
      isIgnored = exclusions
        .filter((pattern) => !isNegationPattern(pattern))
        .some((pattern) => matchWithContainingFolder(path, pattern, fsEntity))

      // If the path is ignored, check for any negated patterns that would include it back
      if (isIgnored) {
        const isNegated = exclusions.some(
          (ignorePattern) =>
            isNegationPattern(ignorePattern) && matchWithContainingFolder(path, ignorePattern.slice(1), fsEntity),
        )

        isIgnored = !isNegated
      }
    }

    return matchesInclusionPatterns && !isIgnored
  }

  return filterAccordingToGlobs
}
