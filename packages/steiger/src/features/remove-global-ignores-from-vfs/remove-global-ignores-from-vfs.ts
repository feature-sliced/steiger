import { Folder, GlobalIgnore } from '@steiger/types'
import { applyExclusion } from '../../shared/globs'

// Todo: move this to shared/globs
function turnGlobalIgnoresIntoSingleGlobGroup(globalIgnores: Array<GlobalIgnore>) {
  const allIgnores = globalIgnores.reduce<Array<string>>((acc, { ignores }) => [...acc, ...ignores], [])
  return {
    files: [],
    ignores: allIgnores,
  }
}

export default function removeGlobalIgnoreFromVfs(vfs: Folder, globalIgnores: Array<GlobalIgnore>): Folder {
  if (globalIgnores.length === 0) {
    return vfs
  }

  const globalIgnoresAsGlobGroup = turnGlobalIgnoresIntoSingleGlobGroup(globalIgnores)

  return applyExclusion(vfs, [globalIgnoresAsGlobGroup])
}
