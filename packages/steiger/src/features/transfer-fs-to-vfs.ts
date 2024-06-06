import { join } from 'node:path'
import chokidar from 'chokidar'
import type { Folder } from '@feature-sliced/filesystem'
import { isGitIgnored } from 'globby'

import { createVfsRoot } from '../models/vfs'

/**
 * Start watching a given path with chokidar.
 *
 * Returns a reactive virtual file system (VFS) and a reference to the watcher
 */
export async function createWatcher(path: string) {
  const vfs = createVfsRoot(path)
  const isIgnored = await isGitIgnored({ cwd: path })

  const watcher = chokidar.watch(path, {
    ignored: isIgnored,
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

  return {
    vfs,
    watcher,
  }
}

/** Scan a folder once without watching and return its virtual file system. */
export function scan(path: string): Promise<Folder> {
  return new Promise<Folder>(async (resolve) => {
    const { vfs, watcher } = await createWatcher(path)

    watcher.on('ready', () => {
      watcher.close()
      resolve(vfs.$tree.getState())
    })
  })
}
