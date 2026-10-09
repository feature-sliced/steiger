import { glob } from 'node:fs/promises'

const configFilePatterns = ['steiger.config.ts', 'steiger.config.js', 'steiger.config.mjs', 'steiger.config.cjs']

export async function findProjectRoots(cwd: string): Promise<string[]> {
  const result: string[] = []

  for await (const configFile of glob(configFilePatterns, { cwd })) {
    result.push(configFile)
  }

  return result
}
