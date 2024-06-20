import { expect, it } from 'vitest'
import { join } from 'node:path'

import { compareMessages, parseIntoFsdRoot } from '../_lib/prepare-test.js'
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
      message: `In "${join('features', 'comments')}", "ui.tsx" is a file segment. Prefer folder segments.`,
    },
    {
      message: `In "${join('pages', 'editor')}", "ui.tsx" is a file segment. Prefer folder segments.`,
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
      message: `On layer "shared", "routes.ts" is a file segment. Prefer folder segments.`,
    },
  ])
})
