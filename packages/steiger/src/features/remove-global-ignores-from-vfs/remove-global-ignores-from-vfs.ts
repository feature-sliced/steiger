import { Folder, GlobalIgnore } from '@steiger/types'
import { applyExclusion } from '../../shared/globs'
import { mergeGlobGroups } from '../../shared/globs/merge-glob-groups'

function turnGlobalIgnoresIntoSingleGlobGroup(globalIgnores: Array<GlobalIgnore>) {
  return mergeGlobGroups(globalIgnores.map(({ ignores }) => ({ files: [], ignores })))
}

export default function removeGlobalIgnoreFromVfs(vfs: Folder, globalIgnores: Array<GlobalIgnore>): Folder {
  if (globalIgnores.length === 0) {
    return vfs
  }

  const globalIgnoresAsGlobGroup = turnGlobalIgnoresIntoSingleGlobGroup(globalIgnores)

  return applyExclusion(vfs, [globalIgnoresAsGlobGroup])
}
