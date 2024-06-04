import nodePath from 'node:path'
import chokidar, { FSWatcher } from 'chokidar'
import type { Folder } from '@feature-sliced/filesystem'

import { createVfsRoot } from '../models/business/vfs'
import { config } from '../models/infractructure/config'

let fsWatcher: FSWatcher | null = null

// TODO rewrite to reactive structure
export const watcher = {
  scan: (path: string) =>
    new Promise<Folder>((resolve) => {
      const vfs = createVfsRoot(path)
      const watcher = chokidar.watch(path, {
        ignoreInitial: false,
        alwaysStat: true,
        awaitWriteFinish: true,
        disableGlobbing: true,
        cwd: path,
      })

      watcher.on('add', async (relativePath) => {
        vfs.fileAdded(nodePath.join(path, relativePath))
      })

      watcher.on('unlink', async (relativePath) => {
        vfs.fileRemoved(nodePath.join(path, relativePath))
      })

      watcher.on('ready', () => {
        watcher.close()
        resolve(vfs.$tree.getState())
      })
    }),
  start: () => {
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

    fsWatcher.on('unlink', async (path) => {
      vfs.fileRemoved(nodePath.join(configValue.path, path))
    })

    return vfs
  },

  stop: async () => {
    if (!fsWatcher) throw Error('watcher already stopped')
    await fsWatcher.close()
    fsWatcher = null
  },
}
