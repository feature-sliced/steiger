import { describe, expect, it, vi } from 'vitest'

import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'
import noPublicApiSidestep from './index.js'

vi.mock('tsconfck', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('tsconfck')>()),
    parse: vi.fn(() => Promise.resolve({ tsconfig: { compilerOptions: { paths: { '@/*': ['/*'] } } } })),
  }
})

vi.mock('node:fs', async (importOriginal) => {
  const originalFs = await importOriginal<typeof import('fs')>()
  const { createFsMocks } = await import('@steiger/toolkit/test')

  return createFsMocks(
    {
      '/shared/i18n/index.ts': '',
      '/shared/i18n/translator.ts': '',
      '/shared/ui/styles.ts': '',
      '/shared/ui/Button.tsx': 'import styles from "./styles";',
      '/shared/ui/TextField.tsx': 'import styles from "./styles";',
      '/shared/ui/index.ts': '',
      '/shared/ui/index.server.js': 'export const serverUtil = () => {};',
      '/shared/ui/index.client.js': 'export const clientUtil = () => {};',
      '/shared/lib/index.ts': '',
      '/shared/lib/dates.ts': '',
      '/shared/lib/i18n/index.ts': '',
      '/shared/lib/i18n/translator.ts': '',
      '/entities/user/@x/product.ts': '',
      '/entities/user/ui/UserAvatar.tsx': 'import { Button } from "@/shared/ui"',
      '/entities/user/index.ts': '',
      '/entities/product/ui/ProductCard.tsx': 'import { UserAvatar } from "@/entities/user"',
      '/entities/product/ui/CrossReferenceCard.tsx': 'import { UserAvatar } from "@/entities/user/@x/product"',
      '/entities/product/index.ts': '',
      '/features/comments/ui/CommentCard.tsx': 'import { styles } from "@/pages/editor"',
      '/features/comments/index.ts': '',
      '/pages/editor/ui/styles.ts': '',
      '/pages/editor/ui/EditorPage.tsx': 'import { Button } from "@/shared/ui"; import { Editor } from "./Editor"',
      '/pages/editor/ui/Editor.tsx':
        'import { TextField } from "@/shared/ui"; import { ProductCard } from "@/entities/product/ui/ProductCard.tsx"',
      '/pages/editor/ui/SubmitButton.tsx':
        'import { Button } from "@/shared/ui/Button"; import { translator } from "@/shared/i18n/translator"',
      '/pages/editor/index.ts': '',
      '/pages/settings/index.ts': '',
      '/pages/settings/ui/SettingsPage.tsx':
        'import { Button } from "@/shared/ui"; import { dates } from "@/shared/lib/dates"; import { translator } from "@/shared/lib/i18n"',
      '/pages/settings/ui/Password.tsx': 'import { translator } from "@/shared/lib/i18n/translator";',
      '/pages/home/ui/HomePage.tsx': `
        import { serverUtil } from "@/shared/ui/index.server.js";
        import { clientUtil } from "@/shared/ui/index.client.js";
        serverUtil();
        clientUtil();
      `,
      '/pages/home/index.ts': '',
    },
    originalFs,
  )
})

it('reports no errors on a project without public API sidesteps', async () => {
  const root = parseIntoFsdRoot(`
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
  `)

  expect((await noPublicApiSidestep.check(root)).diagnostics).toEqual([])
})

it('reports errors on a project with a public API sidestep on entities', async () => {
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

  expect((await noPublicApiSidestep.check(root)).diagnostics).toEqual([
    {
      message: `Forbidden sidestep of public API when importing from "@/entities/product/ui/ProductCard.tsx".`,
      location: {
        path: joinFromRoot('pages', 'editor', 'ui', 'Editor.tsx'),
        start: { column: 71, line: 1 },
        end: { column: 108, line: 1 },
      },
    },
  ])
})

it('reports errors on a project with a public API sidestep on shared', async () => {
  const root = parseIntoFsdRoot(`
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
  `)

  expect((await noPublicApiSidestep.check(root)).diagnostics).toEqual([
    {
      message: `Forbidden sidestep of public API when importing from "@/shared/i18n/translator".`,
      location: {
        path: joinFromRoot('pages', 'editor', 'ui', 'SubmitButton.tsx'),
        start: { column: 74, line: 1 },
        end: { column: 98, line: 1 },
      },
    },
  ])
})

it('reports no errors when importing from multiple public APIs', async () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.server.js
        📄 index.client.js
    📂 pages
      📂 home
        📂 ui
          📄 HomePage.tsx
        📄 index.ts
  `)

  expect((await noPublicApiSidestep.check(root)).diagnostics).toEqual([])
})

describe('specifics of shared/lib and shared/ui', () => {
  it('knows that imports from shared/lib must be one layer deeper', async () => {
    const root = parseIntoFsdRoot(`
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
    `)

    expect((await noPublicApiSidestep.check(root)).diagnostics).toEqual([])
  })

  it('still does not allow sidestepping the index of a single library', async () => {
    const root = parseIntoFsdRoot(`
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
    `)

    expect((await noPublicApiSidestep.check(root)).diagnostics).toEqual([
      {
        message: `Forbidden sidestep of public API when importing from "@/shared/lib/i18n/translator".`,
        location: {
          path: joinFromRoot('pages', 'settings', 'ui', 'Password.tsx'),
          start: { column: 29, line: 1 },
          end: { column: 57, line: 1 },
        },
      },
    ])
  })
})
