import { basename } from 'node:path'
import * as find from 'empathic/find'

import type { PackageManager } from './package-managers'

const lockfiles: Record<string, PackageManager> = {
  'package-lock.json': 'npm',
  'yarn.lock': 'yarn',
  'pnpm-lock.yaml': 'pnpm',
  'bun.lockb': 'bun',
  'bun.lock': 'bun',
}

/** Returns the package manager whose lockfile exists somewhere up the tree. */
export function whichLockfileExists(): PackageManager | undefined {
  const lockfilePath = find.any(Object.keys(lockfiles))

  return lockfilePath ? lockfiles[basename(lockfilePath)] : undefined
}
