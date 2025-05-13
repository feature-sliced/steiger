import type { Folder, File } from '@steiger/types'

/** Recursively walk through a folder and return all entries that satisfy the predicate in a flat array. */
export function findAllRecursively(folder: Folder, predicate: (entry: Folder | File) => boolean): Array<Folder | File> {
  const result: Array<Folder | File> = []

  function walk(entry: Folder | File) {
    if (predicate(entry)) {
      result.push(entry)
    }

    if (entry.type === 'folder') {
      for (const child of entry.children) {
        walk(child)
      }
    }
  }

  walk(folder)
  return result
}
