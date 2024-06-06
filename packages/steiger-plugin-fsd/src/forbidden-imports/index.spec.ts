import { expect, it, vi } from 'vitest'
import type { readFileSync } from 'node:fs'
import { sep } from 'node:path'

import { parseIntoFsdRoot } from '../_lib/prepare-test.js'
import forbiddenImports from './index.js'

vi.mock('tsconfck', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('tsconfck')>()),
    parse: vi.fn(() => Promise.resolve({ tsconfig: { compilerOptions: { paths: { '@/*': ['/*'] } } } })),
  }
})

vi.mock('node:fs', async (importOriginal) => {
  const original = await importOriginal<typeof import('fs')>()

  const mockedFiles = {
    '/shared/ui/styles.ts': '',
    '/shared/ui/Button.tsx': 'import styles from "./styles";',
    '/shared/ui/TextField.tsx': 'import styles from "./styles";',
    '/shared/ui/index.ts': '',
    '/entities/user/ui/UserAvatar.tsx': 'import { Button } from "@/shared/ui"',
    '/entities/user/index.ts': '',
    '/entities/product/ui/ProductCard.tsx': 'import { UserAvatar } from "@/entities/user"',
    '/entities/product/index.ts': '',
    '/features/comments/ui/CommentCard.tsx': 'import { styles } from "@/pages/editor"',
    '/features/comments/index.ts': '',
    '/pages/editor/ui/styles.ts': '',
    '/pages/editor/ui/EditorPage.tsx': 'import { Button } from "@/shared/ui"; import { Editor } from "./Editor"',
    '/pages/editor/ui/Editor.tsx': 'import { TextField } from "@/shared/ui"',
    '/pages/editor/index.ts': '',
  }

  return {
    ...original,
    readFileSync: vi.fn(((path, options) => {
      if (typeof path === 'string' && path in mockedFiles) {
        return mockedFiles[path as keyof typeof mockedFiles]
      } else {
        return original.readFileSync(path, options)
      }
    }) as typeof readFileSync),
    existsSync: vi.fn((path) => Object.keys(mockedFiles).some((key) => key === path || key.startsWith(path + sep))),
  }
})

it('reports no errors on a project with only correct imports', async () => {
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

  expect((await forbiddenImports.check(root)).diagnostics).toEqual([])
})

it('reports errors on a project with cross-imports in entities', async () => {
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
    📂 pages
      📂 editor
        📂 ui
          📄 EditorPage.tsx
          📄 Editor.tsx
        📄 index.ts
  `)

  expect((await forbiddenImports.check(root)).diagnostics).toEqual([
    {
      message:
        'Forbidden cross-import from "/entities/product/ui/ProductCard.tsx" to slice "user" on layer "entities".',
    },
  ])
})

it('reports errors on a project where a feature imports from a page', async () => {
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
          📄 styles.ts
          📄 EditorPage.tsx
          📄 Editor.tsx
        📄 index.ts
  `)

  expect((await forbiddenImports.check(root)).diagnostics).toEqual([
    {
      message: 'Forbidden import from "/features/comments/ui/CommentCard.tsx" to higher layer "pages".',
    },
  ])
})
