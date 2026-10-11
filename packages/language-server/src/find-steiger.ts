import { glob, readFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'

function countSegments(path: string): number {
  let count = 0
  let index = 0

  do {
    index = path.indexOf(sep, index) + 1
    if (index !== 0) count++
  } while (index !== 0)

  return count
}

async function getVersion(packageJsonPath: string): Promise<string | undefined> {
  try {
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))
    return packageJson?.version?.toString()
  } catch {
    return undefined
  }
}

/**
 * @param cwd Project root
 * @returns
 */
export async function findSteigerModule(cwd: string): Promise<{ path?: string; version?: string }> {
  const result = glob('**/node_modules/steiger/dist/app.mjs', { cwd })

  let current: string | undefined = undefined
  let version: string | undefined = undefined

  const candidates: string[] = []
  for await (const file of result) {
    candidates.push(file)
  }
  candidates.sort((a, b) => countSegments(a) - countSegments(b))

  for (const candidate of candidates) {
    current = resolve(cwd, candidate)
    version = await getVersion(resolve(current, '..', '..', 'package.json'))

    // TODO: read export from package.json
    // TODO: add check for latest version
    break
  }

  // TODO: try globally installed steiger if available

  return { path: current, version }
}
