import { posix, sep } from 'node:path'
import { Config } from '@steiger/types'

import { isConfigObject, isConfiguration } from './raw-config'

function convertGlobs(rootPath: string, globs: Array<string>) {
  function composeAbsolutePath(root: string, glob: string) {
    // Remove '/'. The root has platform-specific separators
    const segmentsOfRoot = root.slice(1).split(sep)

    return `/${posix.join(...segmentsOfRoot, glob)}`
  }

  return globs.map((glob) => (glob.startsWith('.') ? composeAbsolutePath(rootPath, glob) : glob))
}

export function convertRelativeGlobsToAbsolute(config: Config, configLocationPath: string | null) {
  if (!configLocationPath) {
    return config
  }

  return config.map((item) => {
    if (!isConfiguration(item)) {
      return item
    }

    const newItem = {
      ...item,
    }

    if (newItem.ignores) {
      newItem.ignores = convertGlobs(configLocationPath, newItem.ignores)
    }

    if (isConfigObject(newItem) && newItem.files) {
      newItem.files = convertGlobs(configLocationPath, newItem.files)
    }

    return newItem
  })
}
