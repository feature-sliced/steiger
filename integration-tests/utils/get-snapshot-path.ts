import os from 'node:os'
import { join } from 'node:path'

const pathPlatform = os.platform() === 'win32' ? 'windows' : 'posix'

export function getSnapshotPath(snapshotName: string) {
  return join('__snapshots__', `${snapshotName}-${pathPlatform}.txt`)
}
