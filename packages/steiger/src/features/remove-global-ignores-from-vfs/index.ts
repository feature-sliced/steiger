import { Folder, GlobalIgnore } from '@steiger/types'
import { copyFsEntity, flattenFolder, recomposeTree } from '../../shared/file-system'
import { createFilterAccordingToGlobs } from '../../shared/globs'

function removeNodes(vfs: Folder, globalIgnores: Array<GlobalIgnore>) {
  const flatVfs = flattenFolder(vfs)

  return recomposeTree(
    copyFsEntity(vfs),
    flatVfs.filter((file) =>
      globalIgnores.every((ignore) => {
        const filterAccordingToGlobs = createFilterAccordingToGlobs({ exclusions: ignore.ignores })

        return !filterAccordingToGlobs(file.path)
      }),
    ),
  )
}

export default function index(vfs: Folder, globalIgnores: Array<GlobalIgnore>) {
  return removeNodes(vfs, globalIgnores)
}
