import nodePath from 'node:path'
import chokidar, { FSWatcher } from 'chokidar'

import { vfs } from '../models/business/vfs'
import { config } from '../models/infractructure/config'
import { environment } from '../models/infractructure/environment'

let fsWatcher: FSWatcher | null = null

// TODO rewrite to reactive structure
export const watcher = {
  start: () => {
    const environmentValue = environment.store.getState()
    if (!environmentValue) throw Error('environment not initialized')

    const configValue = config.store.getState()
    if (!configValue) throw Error('config not initialized')

    if (fsWatcher) throw Error('watcher already started')

    fsWatcher = chokidar.watch(environmentValue?.cwd, {
      ignoreInitial: false,
      alwaysStat: true,
      awaitWriteFinish: true,
      disableGlobbing: true,
      cwd: nodePath.join(environmentValue.cwd, configValue.path),
    })

    fsWatcher.on('add', async (path, stats) => {
      vfs.add({
        type: 'file',
        path: nodePath.join(configValue.path, path),
        // content: (await nodeFsPromises.readFile(nodePath.join(watchRoot, path))).toString(),
      })
    })

    fsWatcher.on('change', async (path, stats) => {
      vfs.change({
        type: 'file',
        path: nodePath.join(configValue.path, path),
        // content: (await nodeFsPromises.readFile(nodePath.join(watchRoot, pathRelative))).toString(),
      })
    })

    fsWatcher.on('unlink', async (pathRelative) => {
      vfs.remove(pathRelative)
    })
  },

  stop: async () => {
    if (!fsWatcher) throw Error('watcher already stopped')
    await fsWatcher.close()
    fsWatcher = null
  }
}
