import { GlobGroup } from './types'

export function mergeGlobGroups(globs: Array<GlobGroup>) {
  return globs.reduce((acc, { files, ignores }) => {
    const globGroup: GlobGroup = {}

    if (files) {
      globGroup.files = [...(acc.files || []), ...files]
    }

    if (ignores) {
      globGroup.ignores = [...(acc.ignores || []), ...ignores]
    }

    return globGroup
  })
}
