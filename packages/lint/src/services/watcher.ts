import nodePath from 'node:path'
import nodeFsPromises from 'node:fs/promises'

import chokidar from 'chokidar'

import { fsUnits } from '../models/fs-units'
import { ConfigInternal } from '../shared/config'

export const createWatcher = (watchRoot: string, config: ConfigInternal) => {
  const fsWatcher = chokidar.watch(watchRoot, {
    ignoreInitial: false,
    alwaysStat: true,
    awaitWriteFinish: true,
    disableGlobbing: true,
    cwd: nodePath.join(config.cwd, config.path),
  })

  fsWatcher.on('add', async (path, stats) => {
    fsUnits.add({
      kind: 'file',
      path: path,
      content: (await nodeFsPromises.readFile(nodePath.join(watchRoot, path))).toString(),
      imports: [],
    })
  })

  fsWatcher.on('change', async (pathRelative, stats) => {
    fsUnits.change({
      kind: 'file',
      path: pathRelative,
      content: (await nodeFsPromises.readFile(nodePath.join(watchRoot, pathRelative))).toString(),
      imports: [],
    })
  })

  fsWatcher.on('unlink', async (pathRelative) => {
    fsUnits.remove(pathRelative)
  })

  return {
    close: async () => await fsWatcher.close(),
  }
}
