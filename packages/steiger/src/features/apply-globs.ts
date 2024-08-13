import { sep } from 'node:path'

import { minimatch } from 'minimatch'
import { File, Folder } from '@steiger/types'

import { isNegationPattern } from '../shared/globs'
import { flattenFolder, copyFsEntity } from '../shared/file-system'

interface ApplyGlobsOptions {
  inclusions?: string[]
  exclusions?: string[]
}

type RequiredApplyGlobsOptions = Required<ApplyGlobsOptions>

/**
 * Turns flat array of files and folders into a tree structure based on the paths.
 * */
function recomposeTree(folder: Folder, nodes: Array<Folder | File>) {
  function getEntityBackToTree(folder: Folder, nested: Folder | File) {
    const pathDiff = nested.path.slice(folder.path.length + 1)
    const pathParts = pathDiff.split(sep).filter(Boolean)
    let currentFolder = folder

    for (let i = 0; i < pathParts.length; i++) {
      const pathPart = pathParts[i]
      const isLastPart = i === pathParts.length - 1
      const nextPath = `${currentFolder.path}${sep}${pathPart}`
      const existingFolder = currentFolder.children.find(
        (child) => child.type === 'folder' && child.path === nextPath,
      ) as Folder | undefined

      if (isLastPart && nested.type === 'file') {
        currentFolder.children.push(nested)
        return
      }

      if (existingFolder) {
        currentFolder = existingFolder
      } else {
        const newFolder: Folder = {
          type: 'folder',
          path: nextPath,
          children: [],
        }
        currentFolder.children.push(newFolder)
        currentFolder = newFolder
      }
    }
  }

  nodes.forEach((node) => {
    getEntityBackToTree(folder, node)
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
