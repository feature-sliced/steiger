import { expect, it } from 'vitest'

import { compareMessages, joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit'
import noFileSegments from './index.js'

it('reports no errors on a project with only folder segments', async () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 styles.ts
        📄 Button.tsx
        📄 TextField.tsx
        📄 index.ts
    📂 pages
      📂 editor
        📂 ui
          📄 EditorPage.tsx
          📄 Editor.tsx
        📄 index.ts
  `)

  expect(noFileSegments.check(root).diagnostics).toEqual([])
})

it('reports no errors on a project with folder segments on sliced layers', async () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 styles.ts
        📄 Button.tsx
        📄 TextField.tsx
        📄 index.ts
    📂 features
      📂 comments
        📄 ui.tsx
        📄 index.ts
    📂 pages
      📂 editor
        📄 ui.tsx
        📄 index.ts
      📂 settings
        📂 ui
          📄 SettingsPage.tsx
        📄 index.ts
  `)

  expect(noFileSegments.check(root).diagnostics).toEqual([
    {
      message: 'This segment is a file. Prefer folder segments.',
      location: { path: joinFromRoot('features', 'comments', 'ui.tsx') },
    },
    {
      message: 'This segment is a file. Prefer folder segments.',
      location: { path: joinFromRoot('pages', 'editor', 'ui.tsx') },
    },
  ])
})

it('reports errors on a project with folder segments in Shared', async () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📄 routes.ts
      📂 ui
        📄 styles.ts
        📄 Button.tsx
        📄 TextField.tsx
        📄 index.ts
    📂 entities
      📂 user
        📂 ui
          📄 UserAvatar.tsx
        📄 index.ts
      📂 product
        📂 ui
          📄 ProductCard.tsx
        📄 index.ts
    📂 features
      📂 comments
        📂 ui
          📄 CommentCard.tsx
        📄 index.ts
    📂 pages
      📂 editor
        📂 ui
          📄 EditorPage.tsx
          📄 Editor.tsx
        📄 index.ts
      📂 settings
        📂 ui
          📄 SettingsPage.tsx
        📄 index.ts
  `)

  expect(noFileSegments.check(root).diagnostics.sort(compareMessages)).toEqual([
    {
      message: 'This segment is a file. Prefer folder segments.',
      location: { path: joinFromRoot('shared', 'routes.ts') },
    },
  ])
})
