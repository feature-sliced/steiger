import { describe, expect, it, vi } from 'vitest'

import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'
import noPublicApiSidestep from './index.js'

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
      '/users/user/project/src/shared/i18n/index.ts': '',
      '/users/user/project/src/shared/i18n/translator.ts': '',
      '/users/user/project/src/shared/ui/styles.ts': '',
      '/users/user/project/src/shared/ui/Button.tsx': 'import styles from "./styles";',
      '/users/user/project/src/shared/ui/TextField.tsx': 'import styles from "./styles";',
      '/users/user/project/src/shared/ui/index.ts': '',
      '/users/user/project/src/shared/lib/index.ts': '',
      '/users/user/project/src/shared/lib/dates.ts': '',
      '/users/user/project/src/shared/lib/i18n/index.ts': '',
      '/users/user/project/src/shared/lib/i18n/translator.ts': '',
      '/users/user/project/src/entities/user/@x/product.ts': '',
      '/users/user/project/src/entities/user/ui/UserAvatar.tsx': 'import { Button } from "@/shared/ui"',
      '/users/user/project/src/entities/user/index.ts': '',
      '/users/user/project/src/entities/product/ui/ProductCard.tsx': 'import { UserAvatar } from "@/entities/user"',
      '/users/user/project/src/entities/product/ui/CrossReferenceCard.tsx':
        'import { UserAvatar } from "@/entities/user/@x/product"',
      '/users/user/project/src/entities/product/index.ts': '',
      '/users/user/project/src/features/comments/ui/CommentCard.tsx': 'import { styles } from "@/pages/editor"',
      '/users/user/project/src/features/comments/index.ts': '',
      '/users/user/project/src/pages/editor/ui/styles.ts': '',
      '/users/user/project/src/pages/editor/ui/EditorPage.tsx':
        'import { Button } from "@/shared/ui"; import { Editor } from "./Editor"',
      '/users/user/project/src/pages/editor/ui/Editor.tsx':
        'import { TextField } from "@/shared/ui"; import { ProductCard } from "@/entities/product/ui/ProductCard.tsx"',
      '/users/user/project/src/pages/editor/ui/SubmitButton.tsx':
        'import { Button } from "@/shared/ui/Button"; import { translator } from "@/shared/i18n/translator"',
      '/users/user/project/src/pages/editor/index.ts': '',
      '/users/user/project/src/pages/settings/index.ts': '',
      '/users/user/project/src/pages/settings/ui/SettingsPage.tsx':
        'import { Button } from "@/shared/ui"; import { dates } from "@/shared/lib/dates"; import { translator } from "@/shared/lib/i18n"',
      '/users/user/project/src/pages/settings/ui/Password.tsx':
        'import { translator } from "@/shared/lib/i18n/translator";',
    },
    originalFs,
  )
})

it('reports no errors on a project without public API sidesteps', async () => {
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
        📂 @x
          📄 product.ts
        📂 ui
          📄 UserAvatar.tsx
        📄 index.ts
      📂 product
        📂 ui
          📄 ProductCard.tsx
          📄 CrossReferenceCard.tsx
        📄 index.ts
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect((await noPublicApiSidestep.check(root)).diagnostics).toEqual([])
})

it('reports errors on a project with a public API sidestep on entities', async () => {
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
    📂 pages
      📂 editor
        📂 ui
          📄 EditorPage.tsx
          📄 Editor.tsx
        📄 index.ts
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect((await noPublicApiSidestep.check(root)).diagnostics).toEqual([
    {
      message: `Forbidden sidestep of public API when importing from "@/entities/product/ui/ProductCard.tsx".`,
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'pages', 'editor', 'ui', 'Editor.tsx') },
    },
  ])
})

it('reports errors on a project with a public API sidestep on shared', async () => {
  const root = parseIntoFsdRoot(
    `
    📂 shared
      📂 ui
        📄 styles.ts
        📄 Button.tsx
        📄 TextField.tsx
        📄 index.ts
      📂 i18n
        📄 index.ts
        📄 translator.ts
    📂 pages
      📂 editor
        📂 ui
          📄 EditorPage.tsx
          📄 SubmitButton.tsx
        📄 index.ts
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect((await noPublicApiSidestep.check(root)).diagnostics).toEqual([
    {
      message: `Forbidden sidestep of public API when importing from "@/shared/i18n/translator".`,
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'pages', 'editor', 'ui', 'SubmitButton.tsx') },
    },
  ])
})

describe('specifics of shared/lib and shared/ui', () => {
  it('knows that imports from shared/lib must be one layer deeper', async () => {
    const root = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 styles.ts
          📄 Button.tsx
          📄 TextField.tsx
          📄 index.ts
        📂 lib
          📄 dates.ts
          📂 i18n
            📄 index.ts
            📄 translator.ts
      📂 pages
        📂 settings
          📂 ui
            📄 SettingsPage.tsx
          📄 index.ts
    `,
      joinFromRoot('users', 'user', 'project', 'src'),
    )

    expect((await noPublicApiSidestep.check(root)).diagnostics).toEqual([])
  })

  it('still does not allow sidestepping the index of a single library', async () => {
    const root = parseIntoFsdRoot(
      `
      📂 shared
        📂 lib
          📄 dates.ts
          📂 i18n
            📄 index.ts
            📄 translator.ts
      📂 pages
        📂 settings
          📂 ui
            📄 SettingsPage.tsx
            📄 Password.tsx
          📄 index.ts
    `,
      joinFromRoot('users', 'user', 'project', 'src'),
    )

    expect((await noPublicApiSidestep.check(root)).diagnostics).toEqual([
      {
        message: `Forbidden sidestep of public API when importing from "@/shared/lib/i18n/translator".`,
        location: { path: joinFromRoot('users', 'user', 'project', 'src', 'pages', 'settings', 'ui', 'Password.tsx') },
      },
    ])
  })
})
