import { expect, it, vi } from 'vitest'
import { join } from 'node:path'

import { compareMessages, joinFromRoot, parseIntoFsdRoot } from '../_lib/prepare-test.js'
import insignificantSlice from './index.js'

vi.mock('tsconfck', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('tsconfck')>()),
    parse: vi.fn(() => Promise.resolve({ tsconfig: { compilerOptions: { paths: { '@/*': ['/*'] } } } })),
  }
})

vi.mock('node:fs', async (importOriginal) => {
  const originalFs = await importOriginal<typeof import('fs')>()
  const { createFsMocks } = await import('../_lib/prepare-test.js')

  return createFsMocks(
    {
      '/shared/ui/styles.ts': '',
      '/shared/ui/Button.tsx': 'import styles from "./styles";',
      '/shared/ui/TextField.tsx': 'import styles from "./styles";',
      '/shared/ui/index.ts': '',

      '/entities/user/@x/product.ts': '',
      '/entities/user/ui/UserAvatar.tsx': 'import { Button } from "@/shared/ui"',
      '/entities/user/index.ts': '',
      '/entities/product/ui/ProductCard.tsx': '',
      '/entities/product/ui/CrossReferenceCard.tsx': 'import { UserAvatar } from "@/entities/user/@x/product"',
      '/entities/product/index.ts': '',
      '/entities/post/index.ts': '',

      '/features/comments/ui/CommentCard.tsx': '',
      '/features/comments/index.ts': '',

      '/pages/editor/ui/EditorPage.tsx':
        'import { Button } from "@/shared/ui"; import { Editor } from "./Editor"; import { CommentCard } from "@/features/comments"; import { UserAvatar } from "@/entities/user"',
      '/pages/editor/ui/Editor.tsx':
        'import { TextField } from "@/shared/ui"; import { UserAvatar } from "@/entities/user"',
      '/pages/editor/index.ts': '',
      '/pages/settings/ui/SettingsPage.tsx':
        'import { Button } from "@/shared/ui"; import { CommentCard } from "@/features/comments"',
      '/pages/settings/index.ts': '',
      '/pages/home/index.ts': '',
      '/pages/category/index.ts': '',
    },
    originalFs,
  )
})

it('reports no errors on a project with slices only on the Pages layer', async () => {
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

  expect((await insignificantSlice.check(root)).diagnostics).toEqual([])
})

it('reports no errors on a project with no insignificant slices', async () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 styles.ts
        📄 Button.tsx
        📄 TextField.tsx
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

  expect((await insignificantSlice.check(root)).diagnostics).toEqual([])
})

it('reports errors on a project with insignificant slices', async () => {
  const root = parseIntoFsdRoot(`
    📂 shared
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

  expect((await insignificantSlice.check(root)).diagnostics.sort(compareMessages)).toEqual([
    {
      message: `This slice has no references. Consider removing it.`,
      location: { path: joinFromRoot('entities', 'product') },
    },
    {
      message: `This slice has only one reference in slice "${join('pages', 'editor')}". Consider merging them.`,
      location: { path: joinFromRoot('entities', 'user') },
    },
  ])
})

it('reports errors on a project where the only other reference to a slice is a cross-import', async () => {
  const root = parseIntoFsdRoot(`
    📂 entities
      📂 user
        📂 @x
          📄 product.ts
        📂 ui
          📄 UserAvatar.tsx
        📄 index.ts
      📂 product
        📂 ui
          📄 CrossReferenceCard.tsx
        📄 index.ts
    📂 pages
      📂 editor
        📂 ui
          📄 EditorPage.tsx
          📄 Editor.tsx
        📄 index.ts
  `)

  expect((await insignificantSlice.check(root)).diagnostics.sort(compareMessages)).toEqual([
    {
      message: `This slice has no references. Consider removing it.`,
      location: { path: joinFromRoot('entities', 'product') },
    },
    {
      message: `This slice has only one reference in slice "${join('pages', 'editor')}". Consider merging them.`,
      location: { path: joinFromRoot('entities', 'user') },
    },
  ])
})
