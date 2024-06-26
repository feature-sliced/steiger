import { join, sep } from 'node:path'
import chokidar from 'chokidar'
import type { Folder } from '@steiger/types'
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
    ignored: (path) => path.split(sep).includes('node_modules') || isIgnored(path),
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
  return new Promise<Folder>((resolve, reject) =>
    createWatcher(path)
      .then(({ vfs, watcher }) => {
        watcher.on('ready', () => {
          watcher.close()
          resolve(vfs.$tree.getState())
        })
      })
      .catch(reject),
  )
}
