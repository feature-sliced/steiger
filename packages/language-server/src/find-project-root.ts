import { getDefaultSearchPlaces } from 'cosmiconfig'
import { glob, readFile } from 'node:fs/promises'
import { basename, dirname, resolve, sep } from 'node:path'

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
const exclude = (p: string) => p.split(sep).includes('node_modules')

export async function findProjectRoots(cwd: string): Promise<string[]> {
  const result = new Set<string>()

  for await (const configFile of glob(configFilePatterns, {
    cwd,
    exclude,
  })) {
    const configFilePath = resolve(cwd, configFile)

    // check if package.json has a steiger field for cosmiconfig
    if (basename(configFilePath) === 'package.json') {
      const packageJson = await readPackageJson(configFilePath)
      if (packageJson?.steiger == null) {
        continue
      }
    }

    result.add(dirname(configFilePath))
  }

  return [...result]
}
