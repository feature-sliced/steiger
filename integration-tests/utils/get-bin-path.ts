import { promises as fs } from 'node:fs'
import * as process from 'node:process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getBinPath } from 'get-bin-path'

/**
 * Resolve the full path to the built JS file of Steiger.
 *
 * Rejects if the file doesn't exist.
 */
export async function getSteigerBinPath() {
  const steiger = (await getBinPath({ cwd: join(dirname(fileURLToPath(import.meta.url)), '../../packages/steiger') }))!
  try {
    await fs.stat(steiger)
  } catch {
    console.error('Run `turbo build` before running integration tests')
    process.exit(1)
  }

  return steiger
}
