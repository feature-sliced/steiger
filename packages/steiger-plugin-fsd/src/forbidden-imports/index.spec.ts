import { expect, it, vi } from 'vitest'

import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit'
import forbiddenImports from './index.js'

vi.mock('tsconfck', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('tsconfck')>()),
    parse: vi.fn(() =>
      Promise.resolve({
        tsconfig: {
          compilerOptions: {
            baseUrl: '/users/user/project/src/',
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
  const { createFsMocks } = await import('@steiger/toolkit')

  return createFsMocks(
    {
      '/users/user/project/src/shared/ui/styles.ts': '',
      '/users/user/project/src/shared/ui/Button.tsx': 'import styles from "./styles";',
      '/users/user/project/src/shared/ui/TextField.tsx': 'import styles from "./styles";',
      '/users/user/project/src/shared/ui/index.ts': '',
      '/users/user/project/src/entities/user/ui/UserAvatar.tsx': 'import { Button } from "@/shared/ui"',
      '/users/user/project/src/entities/user/index.ts': '',
      '/users/user/project/src/entities/user/@x/product.ts': '',
      '/users/user/project/src/entities/product/ui/ProductCard.tsx': 'import { UserAvatar } from "@/entities/user"',
      '/users/user/project/src/entities/product/ui/GoodProductCard.tsx':
        'import { UserAvatar } from "@/entities/user/@x/product"',
      '/users/user/project/src/entities/product/index.ts': '',
      '/users/user/project/src/entities/cart/ui/SmallCart.tsx': 'import { App } from "@/app"',
      '/users/user/project/src/entities/cart/ui/BadSmallCart.tsx':
        'import { UserAvatar } from "@/entities/user/@x/product"',
      '/users/user/project/src/entities/cart/lib/count-cart-items.ts': 'import root from "@/app/root.ts"',
      '/users/user/project/src/entities/cart/lib/index.ts': '',
      '/users/user/project/src/entities/cart/index.ts': '',
      '/users/user/project/src/features/comments/ui/CommentCard.tsx': 'import { styles } from "@/pages/editor"',
      '/users/user/project/src/features/comments/index.ts': '',
      '/users/user/project/src/pages/editor/ui/styles.ts': '',
      '/users/user/project/src/pages/editor/ui/EditorPage.tsx':
        'import { Button } from "@/shared/ui"; import { Editor } from "./Editor"',
      '/users/user/project/src/pages/editor/ui/Editor.tsx': 'import { TextField } from "@/shared/ui"',
      '/users/user/project/src/pages/editor/index.ts': '',
      '/users/user/project/src/app': '',
      '/users/user/project/src/app/ui/index.ts': '',
      '/users/user/project/src/app/index.ts': '',
      '/users/user/project/src/app/root.ts': '',
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
    joinFromRoot('users', 'user', 'project', 'src'),
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
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect((await forbiddenImports.check(root)).diagnostics).toEqual([
    {
      message: `Forbidden cross-import from slice "user".`,
      location: {
        path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'product', 'ui', 'ProductCard.tsx'),
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
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect((await forbiddenImports.check(root)).diagnostics.sort()).toEqual([
    {
      message: `Forbidden import from higher layer "pages".`,
      location: {
        path: joinFromRoot('users', 'user', 'project', 'src', 'features', 'comments', 'ui', 'CommentCard.tsx'),
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
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = (await forbiddenImports.check(root)).diagnostics
  expect(diagnostics).toEqual([
    {
      message: `Forbidden import from higher layer "app".`,
      location: {
        path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'cart', 'lib', 'count-cart-items.ts'),
      },
    },
    {
      message: `Forbidden import from higher layer "app".`,
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'cart', 'ui', 'SmallCart.tsx') },
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
    joinFromRoot('users', 'user', 'project', 'src'),
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
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect((await forbiddenImports.check(root)).diagnostics).toEqual([
    {
      message: `Forbidden cross-import from slice "user".`,
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'cart', 'ui', 'BadSmallCart.tsx') },
    },
  ])
})
