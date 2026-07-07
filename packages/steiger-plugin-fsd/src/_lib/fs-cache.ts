import { statSync } from 'node:fs'

export function createFSCache<T>() {
  const cache = new Map<string, { mtime: number; value: T }>()

  function has(path: string): boolean {
    const data = cache.get(path)
    return data !== undefined && data.mtime === statSync(path).mtimeMs
  }

  function get(path: string): T | undefined {
    if (!has(path)) return undefined
    return cache.get(path)!.value
  }

  function set(path: string, value: T): void {
    cache.set(path, { mtime: statSync(path).mtimeMs, value })
  }

  return { has, get, set }
}
