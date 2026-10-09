import { getDefaultSearchPlaces } from 'cosmiconfig'
import { glob } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const configFilePatterns = getDefaultSearchPlaces('steiger').reduce((acc, cur) => {
  if (cur !== 'package.json') {
    acc.push(`**/${cur}`)
  }

  return acc
}, [] as string[])

export async function findProjectRoots(cwd: string): Promise<string[]> {
  const result: string[] = []

  for await (const configFile of glob(configFilePatterns, { cwd })) {
    result.push(join(cwd, dirname(configFile)))
  }

  return result
}
