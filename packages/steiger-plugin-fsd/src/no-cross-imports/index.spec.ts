import { expect, it, vi } from 'vitest'

import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'
import forbiddenImports from './index.js'

vi.mock('tsconfck', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('tsconfck')>()),
    parse: vi.fn(() =>
      Promise.resolve({
        tsconfig: {
          compilerOptions: {
            baseUrl: '/src/',
            paths: {
              '@/*': ['./*'],
            },
          },
        },
      }),
    ),
  }
})

vi.mock('node:fs', async (importOriginal) => {
  const originalFs = await importOriginal<typeof import('fs')>()
  const { createFsMocks } = await import('@steiger/toolkit/test')

  return createFsMocks(
    {
      '/src/shared/ui/styles.ts': '',
      '/src/shared/ui/Button.tsx': 'import styles from "./styles";',
      '/src/shared/ui/TextField.tsx': 'import styles from "./styles";',
      '/src/shared/ui/index.ts': '',
      '/src/entities/user/ui/UserAvatar.tsx': 'import { Button } from "@/shared/ui"',
      '/src/entities/user/index.ts': '',
      '/src/entities/user/@x/product.ts': '',
      '/src/entities/product/ui/ProductCard.tsx': 'import { UserAvatar } from "@/entities/user"',
      '/src/entities/product/ui/GoodProductCard.tsx': 'import { UserAvatar } from "@/entities/user/@x/product"',
      '/src/entities/product/index.ts': '',
      '/src/entities/cart/ui/SmallCart.tsx': 'import { App } from "@/app"',
      '/src/entities/cart/ui/BadSmallCart.tsx': 'import { UserAvatar } from "@/entities/user/@x/product"',
      '/src/entities/cart/lib/count-cart-items.ts': 'import root from "@/app/root.ts"',
      '/src/entities/cart/lib/index.ts': '',
      '/src/entities/cart/index.ts': '',
      '/src/features/comments/ui/CommentCard.tsx': 'import { styles } from "@/pages/editor"',
      '/src/features/comments/index.ts': '',
      '/src/pages/editor/ui/styles.ts': '',
      '/src/pages/editor/ui/EditorPage.tsx': 'import { Button } from "@/shared/ui"; import { Editor } from "./Editor"',
      '/src/pages/editor/ui/Editor.tsx': 'import { TextField } from "@/shared/ui"',
      '/src/pages/editor/index.ts': '',
      '/src/app': '',
      '/src/app/ui/index.ts': '',
      '/src/app/index.ts': '',
      '/src/app/root.ts': '',
    },
    originalFs,
  )
})

it('reports no errors on a project with only correct imports', async () => {
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
    joinFromRoot('src'),
  )

  expect((await forbiddenImports.check(root)).diagnostics).toEqual([])
})

it('reports errors on a project with cross-imports in entities', async () => {
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
    joinFromRoot('src'),
  )

  expect((await forbiddenImports.check(root)).diagnostics).toEqual([
    {
      message: `Forbidden cross-import from slice "user".`,
      location: { path: joinFromRoot('src', 'entities', 'product', 'ui', 'ProductCard.tsx') },
    },
  ])
})

it('reports no errors on a project with cross-imports through @x', async () => {
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
            📄 GoodProductCard.tsx
          📄 index.ts
      📂 pages
        📂 editor
          📂 ui
            📄 EditorPage.tsx
            📄 Editor.tsx
          📄 index.ts
    `,
    joinFromRoot('src'),
  )

  expect((await forbiddenImports.check(root)).diagnostics).toEqual([])
})

it('reports errors on a project with incorrect cross-imports through @x', async () => {
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
            📄 GoodProductCard.tsx
          📄 index.ts
        📂 cart
          📂 ui
            📄 BadSmallCart.tsx
          📄 index.ts
      📂 pages
        📂 editor
          📂 ui
            📄 EditorPage.tsx
            📄 Editor.tsx
          📄 index.ts
    `,
    joinFromRoot('src'),
  )

  expect((await forbiddenImports.check(root)).diagnostics).toEqual([
    {
      message: `Forbidden cross-import from slice "user".`,
      location: { path: joinFromRoot('src', 'entities', 'cart', 'ui', 'BadSmallCart.tsx') },
    },
  ])
})
