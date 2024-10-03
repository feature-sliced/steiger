import { posix, sep } from 'node:path'
import { Config } from '@steiger/types'

import { isConfigObject, isConfiguration } from './raw-config'

function convertRelativeGlobsToAbsolute(rootPath: string, globs: Array<string>) {
  function composeAbsolutePath(root: string, glob: string) {
    // Remove '/'. The root has platform-specific separators
    const segmentsOfRoot = root.slice(1).split(sep)

    return `/${posix.join(...segmentsOfRoot, glob)}`
  }

  return globs.map((glob) => (glob.startsWith('.') ? composeAbsolutePath(rootPath, glob) : glob))
}

function stripTrailingSlashes(globs: Array<string>) {
  return globs.map((ignore) => ignore.replace(/\/$/, ''))
}

export function transformGlobs(config: Config, configLocationPath: string | null) {
  if (!configLocationPath) {
    return config
  }

  const globsTransformationPipeline = function (globs: Array<string>) {
    const convertToAbsolute = (globs: Array<string>) => convertRelativeGlobsToAbsolute(configLocationPath, globs)
    return convertToAbsolute(stripTrailingSlashes(globs))
  }

  return config.map((item) => {
    if (!isConfiguration(item)) {
      return item
    }

    const newItem = {
      ...item,
    }

    if (newItem.ignores) {
      newItem.ignores = globsTransformationPipeline(newItem.ignores)
    }

    if (isConfigObject(newItem) && newItem.files) {
      newItem.files = globsTransformationPipeline(newItem.files)
    }

    return newItem
  })
}
