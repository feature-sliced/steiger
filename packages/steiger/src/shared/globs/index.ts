import { Folder, File } from '@steiger/types'

import { createFilterAccordingToGlobs } from './create-filter-according-to-globs'
import { copyNode, removeEmptyFolders } from '../file-system'

interface GlobGroup {
  files: string[]
  ignores: string[]
}

interface InvertedGlobGroup extends GlobGroup {
  inverted: boolean
}

export default function excludeFilesBasedOnGlobs(vfs: Folder, globs: Array<GlobGroup | InvertedGlobGroup>): Folder {
  const vfsCopy = copyNode(vfs, true)

  function isIncluded(path: string) {
    return globs.reduce((prev, { files, ignores, ...rest }) => {
      const invertedGlob = 'inverted' in rest
      const matches = createFilterAccordingToGlobs({ inclusions: files, exclusions: ignores })
      const current = matches(path)

      /**
       * Combinations map
       *
       * If an inverted glob matches the current path, exclude it:
       * invertedGlob | current | prev = false
       * invertedGlob | current | !prev = false
       *
       * If a normal glob matches the current path, return the current value
       * !invertedGlob | current | prev = current
       * !invertedGlob | current | !prev = current
       *
       * If a normal glob does not match the current path, keep the decision from the previous iteration.
       * As if the glob is not inverted it's intended to add more paths and not override the previous decision.
       * !invertedGlob | !current | prev = prev
       * !invertedGlob | !current | !prev = prev
       *
       * If an inverted glob does not match the current path, keep the decision from the previous iterations.
       * invertedGlob | !current | prev = prev
       * invertedGlob | !current | !prev = prev
       *
       * */

      if (invertedGlob && current) {
        return false
      } else if ((invertedGlob && !current) || (!invertedGlob && !current)) {
        return prev
      } else {
        return current
      }
    }, false)
  }

  function walk(node: Folder): Folder {
    return {
      ...node,
      children: (node.children as Array<Folder | File>)
        .filter(({ type, path }) => (type === 'folder' ? true : isIncluded(path)))
        .map((child) => {
          if (child.type === 'folder') {
            return walk(child)
          }

          return child
        }),
    }
  }

  return walk(vfsCopy)
}

export function applyExclusion(vfs: Folder, globs: Array<GlobGroup | InvertedGlobGroup>) {
  const vfsCopy = copyNode(vfs, true)

  return removeEmptyFolders(excludeFilesBasedOnGlobs(vfsCopy, globs))
}

export function not(globs: GlobGroup): InvertedGlobGroup {
  return {
    files: globs.files,
    ignores: globs.ignores,
    inverted: true,
  }
}
