import { GlobGroup, InvertedGlobGroup } from './types'

export function not(globs: GlobGroup): InvertedGlobGroup {
  return {
    files: globs.files,
    ignores: globs.ignores,
    inverted: true,
  }
}
