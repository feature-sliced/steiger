import { join } from 'node:path'
import { expect, it, vi } from 'vitest'

import { parseIntoFsdRoot } from '../_lib/prepare-test.js'
import importLocality from './index.js'

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
      '/entities/user/ui/Name.tsx': 'import { Button } from "@/shared/ui"',
      '/entities/user/ui/Status.tsx': 'import { Button } from "@/shared/ui"; import { Name } from "@/entities/user"',
      '/entities/user/ui/UserAvatar.tsx':
        'import { Button } from "@/shared/ui"; import { Name } from "@/entities/user/ui/Name"',
      '/entities/user/index.ts': '',
      '/features/comments/ui/CommentCard.tsx': 'import { Name } from "../../../entities/user"',
      '/features/comments/index.ts': '',
      '/pages/editor/ui/styles.ts': '',
      '/pages/editor/ui/EditorPage.tsx': 'import { Button } from "@/shared/ui"; import { Editor } from "./Editor"',
      '/pages/editor/ui/Editor.tsx': 'import { TextField } from "@/shared/ui"',
      '/pages/editor/index.ts': '',
    },
    originalFs,
  )
})

it('reports no errors on a project with relative imports within slices and absolute imports outside', async () => {
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

  expect((await importLocality.check(root)).diagnostics).toEqual([])
})

it('reports errors on a project with absolute imports within a slice', async () => {
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
          📄 Name.tsx
          📄 UserAvatar.tsx
        📄 index.ts
    📂 pages
      📂 editor
        📂 ui
          📄 EditorPage.tsx
          📄 Editor.tsx
        📄 index.ts
  `)

  expect((await importLocality.check(root)).diagnostics).toEqual([
    {
      message: `Import on "${join('entities', 'user')}" from "${join('ui', 'UserAvatar.tsx')}" to "${join('ui', 'Name.tsx')}" should be relative.`,
    },
  ])
})

it('reports errors on a project with absolute imports from the index within a slice', async () => {
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
          📄 Name.tsx
          📄 Status.tsx
        📄 index.ts
    📂 pages
      📂 editor
        📂 ui
          📄 EditorPage.tsx
          📄 Editor.tsx
        📄 index.ts
  `)

  expect((await importLocality.check(root)).diagnostics).toEqual([
    {
      message: `Import on "${join('entities', 'user')}" from "${join('ui', 'Status.tsx')}" to "index.ts" should be relative.`,
    },
  ])
})

it('reports errors on a project with relative imports between slices', async () => {
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
          📄 Name.tsx
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
  `)

  expect((await importLocality.check(root)).diagnostics).toEqual([
    {
      message: `Import from "${join('features', 'comments', 'ui', 'CommentCard.tsx')}" to "${join('entities', 'user', 'index.ts')} should not be relative.`,
    },
  ])
})
