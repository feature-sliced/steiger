import { GlobGroup } from './types'

export function mergeGlobGroups(globs: Array<GlobGroup>) {
  return globs.reduce((acc, { files, ignores }) => {
    return {
      files: [...acc.files, ...files],
      ignores: [...acc.ignores, ...ignores],
    }
  })
}
