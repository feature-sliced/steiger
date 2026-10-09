import { glob, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

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
  const result = glob('node_modules/steiger/dist/app.mjs', { cwd })

  let current: string | undefined = undefined
  let version: string | undefined = undefined
  for await (const file of result) {
    current = file
    version = await getVersion(resolve(cwd, file, '..', '..', 'package.json'))

    // TODO: read export from package.json
    // TODO: add check for latest version
    break
  }

  // TODO: try globally installed steiger if available

  return { path: current, version }
}
