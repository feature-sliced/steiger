import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

const LAYER_REGEX = /[0-9]?_?(app|pages|widgets|features|entities|shared)/

async function getDirectoryScore(dir: string): Promise<number> {
  let score = 0

  const result = await readdir(dir, { withFileTypes: true })
  for (const entry of result) {
    if (!entry.isDirectory()) continue
    score += LAYER_REGEX.test(entry.name) ? 1 : 0
  }

  return score
}

export async function findSourceDirectory(dir: string): Promise<string | undefined> {
  let bestDir = dir
  let bestScore = await getDirectoryScore(dir)

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue

    const childDir = join(dir, entry.name)
    const score = await getDirectoryScore(childDir)
    if (score > bestScore) {
      bestDir = childDir
      bestScore = score
    }
  }

  return bestDir
}
