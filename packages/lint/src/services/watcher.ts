import path from 'node:path'
import fs from 'node:fs/promises'

import chokidar from 'chokidar'

import { files } from '../model/files'
import { ConfigInternal } from '../shared/config'

export const createWatcher = (watchRoot: string, config: ConfigInternal) => {
  const fsWatcher = chokidar.watch(watchRoot, {
    ignoreInitial: false,
    alwaysStat: true,
    awaitWriteFinish: true,
    disableGlobbing: true,
    cwd: config.cwd,
  })

  fsWatcher.on('add', async (pathRelative, stats) => {
    files.add({
      pathRelative,
      pathAbsolute: path.join(watchRoot, pathRelative),
      pathRoot: watchRoot,
      content: (await fs.readFile(path.join(watchRoot, pathRelative))).toString(),
    })
  })

  fsWatcher.on('change', async (pathRelative, stats) => {
    files.change({
      pathRelative,
      pathAbsolute: path.join(watchRoot, pathRelative),
      pathRoot: watchRoot,
      content: (await fs.readFile(path.join(watchRoot, pathRelative))).toString(),
    })
  })

  fsWatcher.on('unlink', async (pathRelative) => {
    files.remove(pathRelative)
  })

  return {
    close: async () => await fsWatcher.close(),
  }
}
