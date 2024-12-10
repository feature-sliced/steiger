import { join, sep, resolve, parse, dirname } from 'node:path'
import { existsSync } from 'node:fs'
import chokidar from 'chokidar'
import type { Folder } from '@steiger/types'
import { isGitIgnored } from 'globby'

import { createVfsRoot } from '../models/vfs'

function findGitRoot(startDir: string): string | null {
  let currentDir = resolve(startDir)

  while (currentDir !== parse(currentDir).root) {
    const gitFolderOrLinkPath = join(currentDir, '.git')

    if (existsSync(gitFolderOrLinkPath)) {
      return currentDir
    }
    // Move up one directory
    currentDir = dirname(currentDir)
  }

  return null
}

/**
 * Start watching a given path with chokidar.
 *
 * Returns a reactive virtual file system (VFS) and a reference to the watcher
 */
export async function createWatcher(path: string) {
  const vfs = createVfsRoot(path)
  const isIgnored = await isGitIgnored({ cwd: findGitRoot(path) || path })

  const watcher = chokidar.watch(path, {
    ignored: (path) => path.split(sep).includes('node_modules') || isIgnored(path),
    ignoreInitial: false,
    alwaysStat: true,
    awaitWriteFinish: true,
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
