import * as fs from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { replaceSymbols } from 'figures'

const snapshotsFolder = join(dirname(fileURLToPath(import.meta.url)), '../tests/__snapshots__')

// Go through each POSIX snapshot and replace the forward slashes in diagnostic paths with backslashes
for (const file of await fs.readdir(snapshotsFolder)) {
  if (file.endsWith('-posix.txt')) {
    const windowsSnapshotName = file.slice(0, -'-posix.txt'.length) + '-windows.txt'
    const updatedSnapshot = replaceSymbols(await fs.readFile(join(snapshotsFolder, file), 'utf8'), {
      useFallback: true,
    }).replace(/(?<=┌.+)\//gm, '\\')
    await fs.writeFile(join(snapshotsFolder, windowsSnapshotName), updatedSnapshot)
  }
}
