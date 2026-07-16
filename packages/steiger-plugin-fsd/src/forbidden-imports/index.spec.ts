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
      '/src/entities/order/ui/OrderBadge.tsx': '',
      '/src/entities/order/@x/cart/index.ts': '',
      '/src/entities/order/index.ts': '',
      '/src/entities/cart/ui/SmallCart.tsx': 'import { App } from "@/app"',
      '/src/entities/cart/ui/BadSmallCart.tsx': 'import { UserAvatar } from "@/entities/user/@x/product"',
      '/src/entities/cart/ui/CartItem.tsx': 'import { OrderBadge } from "@/entities/order/@x/cart"',
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
      location: {
        path: joinFromRoot('src', 'entities', 'product', 'ui', 'ProductCard.tsx'),
        column: 29,
        line: 1,
        end: { column: 44, line: 1 },
      },
    },
  ])
})

it('reports errors on a project where a feature imports from a page', async () => {
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
            📄 styles.ts
            📄 EditorPage.tsx
            📄 Editor.tsx
          📄 index.ts
    `,
    joinFromRoot('src'),
  )

  expect((await forbiddenImports.check(root)).diagnostics.sort()).toEqual([
    {
      message: `Forbidden import from higher layer "pages".`,
      location: {
        path: joinFromRoot('src', 'features', 'comments', 'ui', 'CommentCard.tsx'),
        column: 25,
        line: 1,
        end: { column: 39, line: 1 },
      },
    },
  ])
})

it('reports errors on a project where a lower level imports from files that are direct children of a higher level', async () => {
  const root = parseIntoFsdRoot(
    `
      📂 shared
        📂 ui
          📄 styles.ts
          📄 Button.tsx
          📄 TextField.tsx
          📄 index.ts
      📂 entities
        📂 cart
          📄 index.ts
          📂 lib
            📄 count-cart-items.ts
            📄 index.ts
          📂 ui
            📄 SmallCart.tsx
      📂 pages
        📂 editor
          📂 ui
            📄 styles.ts
            📄 EditorPage.tsx
            📄 Editor.tsx
          📄 index.ts
      📂 app
        📂 ui
          📄 index.ts
        📄 index.ts
        📄 root.ts
    `,
    joinFromRoot('src'),
  )

  const diagnostics = (await forbiddenImports.check(root)).diagnostics
  expect(diagnostics).toEqual([
    {
      message: `Forbidden import from higher layer "app".`,
      location: {
        path: joinFromRoot('src', 'entities', 'cart', 'lib', 'count-cart-items.ts'),
        column: 19,
        line: 1,
        end: { column: 32, line: 1 },
      },
    },
    {
      message: `Forbidden import from higher layer "app".`,
      location: {
        path: joinFromRoot('src', 'entities', 'cart', 'ui', 'SmallCart.tsx'),
        column: 22,
        line: 1,
        end: { column: 27, line: 1 },
      },
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

it('reports no errors on a project with cross-imports through @x index files', async () => {
  const root = parseIntoFsdRoot(
    `
      📂 shared
        📂 ui
          📄 styles.ts
          📄 Button.tsx
          📄 TextField.tsx
          📄 index.ts
      📂 entities
        📂 order
          📂 @x
            📂 cart
              📄 index.ts
          📂 ui
            📄 OrderBadge.tsx
          📄 index.ts
        📂 cart
          📂 ui
            📄 CartItem.tsx
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
      location: {
        path: joinFromRoot('src', 'entities', 'cart', 'ui', 'BadSmallCart.tsx'),
        column: 29,
        line: 1,
        end: { column: 55, line: 1 },
      },
    },
  ])
})
