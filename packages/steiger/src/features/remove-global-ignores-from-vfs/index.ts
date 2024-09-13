import { Folder, GlobalIgnore } from '@steiger/types'
import { copyFsEntity, flattenFolder, recomposeTree } from '../../shared/file-system'
import { createFilterAccordingToGlobs } from '../../shared/globs'

export default function removeGlobalIgnoresFromVfs(vfs: Folder, globalIgnores: Array<GlobalIgnore>) {
  const flatVfs = flattenFolder(vfs)

  return recomposeTree(
    copyFsEntity(vfs),
    flatVfs.filter((file) =>
      globalIgnores.every((ignore) => {
        const filterAccordingToGlobs = createFilterAccordingToGlobs({ exclusions: ignore.ignores })

        return filterAccordingToGlobs(file.path, file.type)
      }),
    ),
  )
}
