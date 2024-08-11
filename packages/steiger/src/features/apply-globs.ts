import { minimatch } from 'minimatch'
import { File, Folder } from '@steiger/types'

interface ApplyGlobsOptions {
  inclusions?: string[]
  exclusions?: string[]
}

type RequiredApplyGlobsOptions = Required<ApplyGlobsOptions>

function isNegationPattern(pattern: string) {
  return pattern.startsWith('!')
}

function copyFsEntity<T extends Folder | File>(fsEntity: T, deep: boolean = false) {
  if (fsEntity.type === 'folder') {
    const newChildren: Array<Folder | File> = deep
      ? fsEntity.children.map((child) => (child.type === 'folder' ? copyFsEntity(child, true) : child))
      : []

    return {
      ...fsEntity,
      children: newChildren,
    }
  }

  return { ...fsEntity }
}

function flattenFolder(folder: Folder): File[] {
  return folder.children.reduce((acc, child) => {
    if (child.type === 'file') {
      return [...acc, child]
    }

    return [...acc, ...flattenFolder(child)]
  }, [] as File[])
}

function recomposeTree(folder: Folder, nodes: Array<Folder | File>) {
  function createPath(folder: Folder, nested: Folder | File) {
    const pathDiff = nested.path.slice(folder.path.length + 1)
    const pathParts = pathDiff.split('/').filter(Boolean)
    let currentFolder = folder

    for (let i = 0; i < pathParts.length; i++) {
      const pathPart = pathParts[i]
      const isLastPart = i === pathParts.length - 1
      const existingFolder = currentFolder.children.find(
        (child) => child.type === 'folder' && child.path === `${currentFolder.path}/${pathPart}`,
      )

      if (isLastPart && nested.type === 'file') {
        currentFolder.children.push(nested)
        return
      }

      if (existingFolder) {
        currentFolder = existingFolder as Folder
      } else {
        const newFolder: Folder = {
          type: 'folder',
          path: `${currentFolder.path}/${pathPart}`,
          children: [],
        }
        currentFolder.children.push(newFolder)
        currentFolder = newFolder
      }
    }
  }

  nodes.forEach((node) => {
    createPath(folder, node)
  })
}

function createFilterAccordingToGlobs({ inclusions, exclusions }: RequiredApplyGlobsOptions) {
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

// ! Don't use platform specific path separators in the glob patterns for globby
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
