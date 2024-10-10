import { Folder, GlobalIgnore } from '@steiger/types'
import { applyExclusion } from '../../shared/globs'
import { mergeGlobGroups } from '../../shared/globs/merge-glob-groups'

export default function removeGlobalIgnoreFromVfs(vfs: Folder, globalIgnores: Array<GlobalIgnore>): Folder {
  if (globalIgnores.length === 0) {
    return vfs
  }

  const globalIgnoresAsGlobGroup = mergeGlobGroups(globalIgnores)

  return applyExclusion(vfs, [globalIgnoresAsGlobGroup])
}
