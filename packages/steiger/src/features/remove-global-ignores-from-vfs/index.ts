import { Folder, File, GlobalIgnore } from '@steiger/types'
import { createFilterAccordingToGlobs } from '../../shared/globs/create-filter-according-to-globs'
import { removeEmptyFolders } from '../../shared/file-system'

export default function removeGlobalIgnoreFromVfs(vfs: Folder, globalIgnores: Array<GlobalIgnore>): Folder {
  if (globalIgnores.length === 0) {
    return vfs
  }

  function matchIgnores(file: File) {
    return globalIgnores.every((ignore) => {
      const filterAccordingToGlobs = createFilterAccordingToGlobs({ exclusions: ignore.ignores })

      return filterAccordingToGlobs(file.path)
    })
  }

  function walk(node: Folder): Folder {
    const children = node.children
      .map((node) => (node.type === 'file' ? node : walk(node)))
      .filter((node) => (node.type === 'file' ? matchIgnores(node) : true))

    return {
      ...node,
      children,
    }
  }

  return removeEmptyFolders(walk(vfs))
}
