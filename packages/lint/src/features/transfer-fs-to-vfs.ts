import nodePath from 'node:path'
import chokidar, { FSWatcher } from 'chokidar'

import { createVfsRoot } from '../models/business/vfs'
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
    const vfs = createVfsRoot(configValue.path)

    if (fsWatcher) throw Error('watcher already started')

    fsWatcher = chokidar.watch(configValue.path, {
      ignoreInitial: false,
      alwaysStat: true,
      awaitWriteFinish: true,
      disableGlobbing: true,
      cwd: configValue.path,
    })

    fsWatcher.on('add', async (path) => {
      vfs.fileAdded(nodePath.join(configValue.path, path))
    })

    return vfs
  },

  stop: async () => {
    if (!fsWatcher) throw Error('watcher already stopped')
    await fsWatcher.close()
    fsWatcher = null
  },
}
