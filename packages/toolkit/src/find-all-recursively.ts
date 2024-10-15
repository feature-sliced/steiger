import { basename } from 'node:path'
import type { Folder, File } from '@steiger/types'

import { joinFromRoot, parseIntoFolder } from './prepare-test.js'

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

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest

  test('findAllRecursively', () => {
    const root = parseIntoFolder(`
      📂 folder1
        📂 directory1
          📄 styles.ts
          📄 Button.tsx
          📄 TextField.tsx
          📄 index.ts
      📂 folder2
        📂 folder3
          📂 directory2
            📄 CommentCard.tsx
          📄 index.ts
      📂 directory3
        📂 folder4
          📂 folder5
            📄 styles.ts
            📄 EditorPage.tsx
            📄 Editor.tsx
          📄 index.ts
    `)

    const result = findAllRecursively(
      root,
      (entry) => entry.type === 'folder' && basename(entry.path).includes('directory'),
    )

    expect(result.map((entry) => entry.path)).toEqual([
      joinFromRoot('folder1', 'directory1'),
      joinFromRoot('folder2', 'folder3', 'directory2'),
      joinFromRoot('directory3'),
    ])
  })
}
