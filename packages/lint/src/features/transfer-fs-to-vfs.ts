import { join } from 'node:path'
import chokidar, { type FSWatcher } from 'chokidar'
import type { Folder } from '@feature-sliced/filesystem'

import { createVfsRoot } from '../models/business/vfs'

export function scan(path: string): Promise<Folder> {
  return new Promise<Folder>((resolve) => {
    const vfs = createVfsRoot(path)
    const watcher = chokidar.watch(path, {
      ignoreInitial: false,
      alwaysStat: true,
      awaitWriteFinish: true,
      disableGlobbing: true,
      cwd: path,
    })

    watcher.on('add', async (relativePath) => {
      vfs.fileAdded(join(path, relativePath))
    })

    watcher.on('unlink', async (relativePath) => {
      vfs.fileRemoved(join(path, relativePath))
    })

    watcher.on('ready', () => {
      watcher.close()
      resolve(vfs.$tree.getState())
    })
  })
}

export function createWatcher(path: string) {
  const vfs = createVfsRoot(path)

  const fsWatcher = chokidar.watch(path, {
    ignoreInitial: false,
    alwaysStat: true,
    awaitWriteFinish: true,
    disableGlobbing: true,
    cwd: path,
  })

  fsWatcher.on('add', async (relativePath) => {
    vfs.fileAdded(join(path, relativePath))
  })

  fsWatcher.on('unlink', async (relativePath) => {
    vfs.fileRemoved(join(path, relativePath))
  })

  return {
    vfs,
    stop: () => fsWatcher.close()
  }
}
