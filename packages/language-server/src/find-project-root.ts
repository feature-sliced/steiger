import { getDefaultSearchPlaces } from 'cosmiconfig'
import { glob, readFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

type PackageJson = {
  [key: string]: unknown
} | null

async function readPackageJson(filePath: string): Promise<PackageJson> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch {
    return null
  }
}

const configFilePatterns = getDefaultSearchPlaces('steiger').map((place) => `**/${place}`)

export async function findProjectRoots(cwd: string): Promise<string[]> {
  const result: string[] = []

  for await (const configFile of glob(configFilePatterns, { cwd })) {
    const filePath = join(cwd, dirname(configFile))

    // check if package.json has a steiger field for cosmiconfig
    if (basename(filePath) === 'package.json') {
      const packageJson = await readPackageJson(filePath)
      if (packageJson?.steiger == null) {
        continue
      }
    }

    result.push(filePath)
  }

  return result
}
