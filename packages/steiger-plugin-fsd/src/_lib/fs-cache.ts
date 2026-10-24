import { statSync } from 'node:fs'

export function createFSCache<T>() {
  const cache = new Map<string, { mtime: number; value: T }>()

  function has(key: string, mtimeSourcePath: string = key): boolean {
    const data = cache.get(key)
    if (data === undefined) return false

    return data.mtime === statSync(mtimeSourcePath, { throwIfNoEntry: false })?.mtimeMs
  }

  function get(key: string, mtimeSourcePath: string = key): T | undefined {
    if (!has(key, mtimeSourcePath)) return undefined
    return cache.get(key)!.value
  }

  function set(key: string, value: T, mtimeSourcePath: string = key): void {
    const mtime = statSync(mtimeSourcePath, { throwIfNoEntry: false })?.mtimeMs
    if (mtime === undefined) return

    cache.set(key, { mtime, value })
  }

  return { has, get, set }
}
