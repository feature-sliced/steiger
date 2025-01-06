import { expect, it, vi } from 'vitest'
import { join } from 'node:path'

import { compareMessages, joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit'
import insignificantSlice from './index.js'

vi.mock('tsconfck', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('tsconfck')>()),
    parse: vi.fn(() =>
      Promise.resolve({ tsconfig: { compilerOptions: { paths: { '@/*': ['/users/user/project/src/*'] } } } }),
    ),
  }
})

vi.mock('node:fs', async (importOriginal) => {
  const originalFs = await importOriginal<typeof import('fs')>()
  const { createFsMocks } = await import('@steiger/toolkit')

  return createFsMocks(
    {
      '/users/user/project/src/shared/ui/styles.ts': '',
      '/users/user/project/src/shared/ui/Button.tsx': 'import styles from "./styles";',
      '/users/user/project/src/shared/ui/TextField.tsx': 'import styles from "./styles";',
      '/users/user/project/src/shared/ui/index.ts': '',

      '/users/user/project/src/entities/user/@x/product.ts': '',
      '/users/user/project/src/entities/user/ui/UserAvatar.tsx': 'import { Button } from "@/shared/ui"',
      '/users/user/project/src/entities/user/index.ts': '',
      '/users/user/project/src/entities/product/ui/ProductCard.tsx': '',
      '/users/user/project/src/entities/product/ui/CrossReferenceCard.tsx':
        'import { UserAvatar } from "@/entities/user/@x/product"',
      '/users/user/project/src/entities/product/index.ts': '',
      '/users/user/project/src/entities/post/index.ts': '',

      '/users/user/project/src/features/comments/ui/CommentCard.tsx': '',
      '/users/user/project/src/features/comments/index.ts': '',

      '/users/user/project/src/widgets/sidebar/ui/Sidebar.tsx': '',
      '/users/user/project/src/widgets/sidebar/index.ts': '',

      '/users/user/project/src/pages/editor/ui/EditorPage.tsx':
        'import { Button } from "@/shared/ui"; import { Editor } from "./Editor"; import { CommentCard } from "@/features/comments"; import { UserAvatar } from "@/entities/user"',
      '/users/user/project/src/pages/editor/ui/Editor.tsx':
        'import { TextField } from "@/shared/ui"; import { UserAvatar } from "@/entities/user"',
      '/users/user/project/src/pages/editor/index.ts': '',
      '/users/user/project/src/pages/settings/ui/SettingsPage.tsx':
        'import { Button } from "@/shared/ui"; import { CommentCard } from "@/features/comments"',
      '/users/user/project/src/pages/settings/index.ts': '',
      '/users/user/project/src/pages/home/index.ts': '',
      '/users/user/project/src/pages/category/index.ts': '',

      '/users/user/project/src/app/layouts/BaseLayout.tsx': 'import { Sidebar } from "@/widgets/sidebar"',
    },
    originalFs,
  )
})

it('reports no errors on a project with slices only on the Pages layer', async () => {
  const root = parseIntoFsdRoot(
    `
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
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect((await insignificantSlice.check(root)).diagnostics).toEqual([])
})

it('reports no errors on a project with no insignificant slices', async () => {
  const root = parseIntoFsdRoot(
    `
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
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect((await insignificantSlice.check(root)).diagnostics).toEqual([])
})

it('reports no errors when the only usage of a slice is on the App layer', async () => {
  const root = parseIntoFsdRoot(
    `
    📂 widgets
      📂 sidebar
        📂 ui
          📄 Sidebar.tsx
        📄 index.ts
    📂 app
      📂 layouts
        📄 BaseLayout.tsx
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect((await insignificantSlice.check(root)).diagnostics).toEqual([])
})

it('reports errors on a project with insignificant slices', async () => {
  const root = parseIntoFsdRoot(
    `
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
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect((await insignificantSlice.check(root)).diagnostics.sort(compareMessages)).toEqual([
    {
      message: `This slice has no references. Consider removing it.`,
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'product') },
    },
    {
      message: `This slice has only one reference in slice "${join('pages', 'editor')}". Consider merging them.`,
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'user') },
    },
  ])
})

it('reports errors on a project where the only other reference to a slice is a cross-import', async () => {
  const root = parseIntoFsdRoot(
    `
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
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect((await insignificantSlice.check(root)).diagnostics.sort(compareMessages)).toEqual([
    {
      message: `This slice has no references. Consider removing it.`,
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'product') },
    },
    {
      message: `This slice has only one reference in slice "${join('pages', 'editor')}". Consider merging them.`,
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'user') },
    },
  ])
})
