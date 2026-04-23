import { expect, it, vi } from 'vitest'

import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'
import importLocality from './index.js'

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
  const { createFsMocks } = await import('@steiger/toolkit/test')

  return createFsMocks(
    {
      '/users/user/project/src/shared/ui/styles.ts': '',
      '/users/user/project/src/shared/ui/Button.tsx': 'import styles from "./styles";',
      '/users/user/project/src/shared/ui/TextField.tsx': 'import styles from "./styles";',
      '/users/user/project/src/shared/ui/index.ts': '',
      '/users/user/project/src/entities/user/ui/Name.tsx': 'import { Button } from "@/shared/ui"',
      '/users/user/project/src/entities/user/ui/Status.tsx':
        'import { Button } from "@/shared/ui"; import { Name } from "@/entities/user"',
      '/users/user/project/src/entities/user/ui/UserAvatar.tsx':
        'import { Button } from "@/shared/ui"; import { Name } from "@/entities/user/ui/Name"',
      '/users/user/project/src/entities/user/index.ts': '',
      '/users/user/project/src/features/comments/ui/CommentCard.tsx': 'import { Name } from "../../../entities/user"',
      '/users/user/project/src/features/comments/index.ts': '',
      '/users/user/project/src/pages/editor/ui/styles.ts': '',
      '/users/user/project/src/pages/editor/ui/EditorPage.tsx':
        'import { Button } from "@/shared/ui"; import { Editor } from "./Editor"',
      '/users/user/project/src/pages/editor/ui/Editor.tsx': 'import { TextField } from "@/shared/ui"',
      '/users/user/project/src/pages/editor/index.ts': '',
    },
    originalFs,
  )
})

it('reports no errors on a project with relative imports within slices and absolute imports outside', async () => {
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

  expect((await importLocality.check(root)).diagnostics).toEqual([])
})

it('reports errors on a project with absolute imports within a slice', async () => {
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
          📄 Name.tsx
          📄 UserAvatar.tsx
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

  expect((await importLocality.check(root)).diagnostics).toEqual([
    {
      message: `Import from "@/entities/user/ui/Name" should be relative.`,
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'user', 'ui', 'UserAvatar.tsx') },
    },
  ])
})

it('reports errors on a project with absolute imports from the index within a slice', async () => {
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
          📄 Name.tsx
          📄 Status.tsx
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

  expect((await importLocality.check(root)).diagnostics).toEqual([
    {
      message: `Import from "@/entities/user" should be relative.`,
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'user', 'ui', 'Status.tsx') },
    },
  ])
})

it('reports errors on a project with relative imports between slices', async () => {
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
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect((await importLocality.check(root)).diagnostics).toEqual([
    {
      message: `Import from "../../../entities/user" should not be relative.`,
      location: {
        path: joinFromRoot('users', 'user', 'project', 'src', 'features', 'comments', 'ui', 'CommentCard.tsx'),
      },
    },
  ])
})
