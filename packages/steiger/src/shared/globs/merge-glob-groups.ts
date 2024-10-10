import { GlobGroup } from './types'

export function mergeGlobGroups(globs: Array<GlobGroup>) {
  return globs.reduce((acc, { files, ignores }) => {
    const interimGlobGroup: GlobGroup = { ...acc }

    if (files) {
      interimGlobGroup.files = [...(acc.files || []), ...files]
    }

    if (ignores) {
      interimGlobGroup.ignores = [...(acc.ignores || []), ...ignores]
    }

    return interimGlobGroup
  })
}
