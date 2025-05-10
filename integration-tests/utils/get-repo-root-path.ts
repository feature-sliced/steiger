import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Return the absolute path to the root of this repository. */
export function getRepoRootPath() {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const repoRootPath = join(__dirname, '..', '..')
  return repoRootPath
}
