import { basename } from 'node:path'
import { expect, test } from 'vitest'

import { findAllRecursively } from './find-all-recursively.js'
import { joinFromRoot, parseIntoFolder } from './prepare-test.js'

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
