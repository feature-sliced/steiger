import { expect, it, vi } from 'vitest'

import { compareMessages, joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'
import noWildcardExports from './index.js'

vi.mock('node:fs', async (importOriginal) => {
  const originalFs = await importOriginal<typeof import('fs')>()
  const { createFsMocks } = await import('@steiger/toolkit/test')

  return createFsMocks(
    {
      // Public APIs that list everything they export
      '/src/shared/ui/index.ts': [
        "export { Button } from './Button'",
        "export * as positions from './tooltip-positions'",
      ].join('\n'),
      '/src/shared/ui/Button.tsx': 'export function Button() {}',
      '/src/shared/ui/tooltip-positions.ts': "export const top = 'top'",
      '/src/entities/user/index.ts': [
        "export { UserCard } from './ui'",
        "export { type User, useUser } from './model/user'",
      ].join('\n'),
      '/src/entities/user/ui/index.ts': "export { UserCard } from './UserCard'",
      '/src/entities/user/ui/UserCard.tsx': 'export function UserCard() {}',
      '/src/entities/user/model/user.ts': 'export function useUser() {}',

      // A slice that wildcard-exports inside a module, but not in its public API
      '/src/entities/session/index.ts': "export { useSession } from './model/session'",
      '/src/entities/session/model/session.ts': "export * from './tokens'",
      '/src/entities/session/model/tokens.ts': 'export const token = null',

      // Wildcard exports in the public API of a slice
      '/src/entities/product/index.ts': ["export * from './ui/ProductCard'", "export * from './model/product'"].join(
        '\n',
      ),
      '/src/entities/product/ui/ProductCard.tsx': 'export function ProductCard() {}',
      '/src/entities/product/model/product.ts': 'export const product = {}',

      // Wildcard exports on the Shared layer
      '/src/shared/lib/index.ts': "export * from './format-date'",
      '/src/shared/lib/format-date.ts': 'export function formatDate() {}',

      // Wildcard exports on the App layer
      '/src/app/index.ts': "export * from './providers'",
      '/src/app/providers.tsx': 'export function Providers() {}',

      // A public API that mixes export kinds
      '/src/widgets/header/index.ts': [
        "export { Header } from './ui/Header'",
        "export * from './ui/Nav'",
        "export * as theme from './model/theme'",
        "export type { HeaderProps } from './ui/Header'",
        'export * from "./lib/use-scroll";',
      ].join('\n'),
      '/src/widgets/header/ui/Header.tsx': 'export function Header() {}',
      '/src/widgets/header/ui/Nav.tsx': 'export function Nav() {}',
      '/src/widgets/header/model/theme.ts': "export const theme = 'light'",
      '/src/widgets/header/lib/use-scroll.ts': 'export function useScroll() {}',

      // Index file variants are public APIs as well
      '/src/pages/home/index.client.ts': "export * from './ui/HomePage'",
      '/src/pages/home/index.server.ts': [
        "export { loadHome } from './api/load-home'",
        "export * from './api/errors'",
      ].join('\n'),
      '/src/pages/home/ui/HomePage.tsx': 'export function HomePage() {}',
      '/src/pages/home/api/load-home.ts': 'export function loadHome() {}',
      '/src/pages/home/api/errors.ts': 'export class LoadError extends Error {}',

      // A public API spread over several lines
      '/src/features/auth/index.ts': [
        'export {',
        '  useAuth,',
        "} from './model/auth'",
        '',
        "export * from './ui/LoginForm'",
      ].join('\n'),
      '/src/features/auth/model/auth.ts': 'export function useAuth() {}',
      '/src/features/auth/ui/LoginForm.tsx': 'export function LoginForm() {}',

      // A public API nested inside a segment of the Shared layer
      '/src/shared/api/index.ts': "export { client } from './client'",
      '/src/shared/api/client.ts': 'export const client = {}',
      '/src/shared/api/rest/index.ts': "export * from './endpoints'",
      '/src/shared/api/rest/endpoints.ts': 'export const endpoints = {}',

      // A public API that isn't source code
      '/src/shared/styles/index.css': ':root {\n  color: red;\n}',
    },
    originalFs,
  )
})

it('reports no errors when public APIs list their exports explicitly', async () => {
  const root = parseIntoFsdRoot(
    `
      📂 shared
        📂 ui
          📄 Button.tsx
          📄 tooltip-positions.ts
          📄 index.ts
      📂 entities
        📂 user
          📂 ui
            📄 UserCard.tsx
            📄 index.ts
          📂 model
            📄 user.ts
          📄 index.ts
    `,
    joinFromRoot('src'),
  )

  expect((await noWildcardExports.check(root)).diagnostics).toEqual([])
})

it('ignores wildcard exports in files that are not a public API', async () => {
  const root = parseIntoFsdRoot(
    `
      📂 entities
        📂 session
          📂 model
            📄 session.ts
            📄 tokens.ts
          📄 index.ts
    `,
    joinFromRoot('src'),
  )

  expect((await noWildcardExports.check(root)).diagnostics).toEqual([])
})

it('reports wildcard exports in the public API of a slice', async () => {
  const root = parseIntoFsdRoot(
    `
      📂 entities
        📂 product
          📂 ui
            📄 ProductCard.tsx
          📂 model
            📄 product.ts
          📄 index.ts
    `,
    joinFromRoot('src'),
  )

  expect((await noWildcardExports.check(root)).diagnostics).toEqual([
    {
      message: `Wildcard export from "./ui/ProductCard" hides the public API. List the exported names instead.`,
      location: {
        path: joinFromRoot('src', 'entities', 'product', 'index.ts'),
        start: { line: 1, column: 1 },
        end: { line: 1, column: 33 },
      },
    },
    {
      message: `Wildcard export from "./model/product" hides the public API. List the exported names instead.`,
      location: {
        path: joinFromRoot('src', 'entities', 'product', 'index.ts'),
        start: { line: 2, column: 1 },
        end: { line: 2, column: 32 },
      },
    },
  ])
})

it('reports wildcard exports on the Shared and App layers', async () => {
  const root = parseIntoFsdRoot(
    `
      📂 shared
        📂 lib
          📄 format-date.ts
          📄 index.ts
      📂 app
        📄 providers.tsx
        📄 index.ts
    `,
    joinFromRoot('src'),
  )

  expect((await noWildcardExports.check(root)).diagnostics.sort(compareMessages)).toEqual([
    {
      message: `Wildcard export from "./format-date" hides the public API. List the exported names instead.`,
      location: {
        path: joinFromRoot('src', 'shared', 'lib', 'index.ts'),
        start: { line: 1, column: 1 },
        end: { line: 1, column: 30 },
      },
    },
    {
      message: `Wildcard export from "./providers" hides the public API. List the exported names instead.`,
      location: {
        path: joinFromRoot('src', 'app', 'index.ts'),
        start: { line: 1, column: 1 },
        end: { line: 1, column: 28 },
      },
    },
  ])
})

it('reports only the wildcard exports in a public API that mixes export kinds', async () => {
  const root = parseIntoFsdRoot(
    `
      📂 widgets
        📂 header
          📂 ui
            📄 Header.tsx
            📄 Nav.tsx
          📂 model
            📄 theme.ts
          📂 lib
            📄 use-scroll.ts
          📄 index.ts
    `,
    joinFromRoot('src'),
  )

  expect((await noWildcardExports.check(root)).diagnostics).toEqual([
    {
      message: `Wildcard export from "./ui/Nav" hides the public API. List the exported names instead.`,
      location: {
        path: joinFromRoot('src', 'widgets', 'header', 'index.ts'),
        start: { line: 2, column: 1 },
        end: { line: 2, column: 25 },
      },
    },
    {
      message: `Wildcard export from "./lib/use-scroll" hides the public API. List the exported names instead.`,
      location: {
        path: joinFromRoot('src', 'widgets', 'header', 'index.ts'),
        start: { line: 5, column: 1 },
        end: { line: 5, column: 34 },
      },
    },
  ])
})

it('checks index file variants like index.client.ts and index.server.ts', async () => {
  const root = parseIntoFsdRoot(
    `
      📂 pages
        📂 home
          📂 ui
            📄 HomePage.tsx
          📂 api
            📄 load-home.ts
            📄 errors.ts
          📄 index.client.ts
          📄 index.server.ts
    `,
    joinFromRoot('src'),
  )

  expect((await noWildcardExports.check(root)).diagnostics).toEqual([
    {
      message: `Wildcard export from "./ui/HomePage" hides the public API. List the exported names instead.`,
      location: {
        path: joinFromRoot('src', 'pages', 'home', 'index.client.ts'),
        start: { line: 1, column: 1 },
        end: { line: 1, column: 30 },
      },
    },
    {
      message: `Wildcard export from "./api/errors" hides the public API. List the exported names instead.`,
      location: {
        path: joinFromRoot('src', 'pages', 'home', 'index.server.ts'),
        start: { line: 2, column: 1 },
        end: { line: 2, column: 29 },
      },
    },
  ])
})

it('does not confuse a named export spread over several lines with a wildcard export', async () => {
  const root = parseIntoFsdRoot(
    `
      📂 features
        📂 auth
          📂 ui
            📄 LoginForm.tsx
          📂 model
            📄 auth.ts
          📄 index.ts
    `,
    joinFromRoot('src'),
  )

  expect((await noWildcardExports.check(root)).diagnostics).toEqual([
    {
      message: `Wildcard export from "./ui/LoginForm" hides the public API. List the exported names instead.`,
      location: {
        path: joinFromRoot('src', 'features', 'auth', 'index.ts'),
        start: { line: 5, column: 1 },
        end: { line: 5, column: 31 },
      },
    },
  ])
})

it('checks the public API of a folder nested inside a segment', async () => {
  const root = parseIntoFsdRoot(
    `
      📂 shared
        📂 api
          📂 rest
            📄 endpoints.ts
            📄 index.ts
          📄 client.ts
          📄 index.ts
    `,
    joinFromRoot('src'),
  )

  expect((await noWildcardExports.check(root)).diagnostics).toEqual([
    {
      message: `Wildcard export from "./endpoints" hides the public API. List the exported names instead.`,
      location: {
        path: joinFromRoot('src', 'shared', 'api', 'rest', 'index.ts'),
        start: { line: 1, column: 1 },
        end: { line: 1, column: 28 },
      },
    },
  ])
})

it('skips public APIs that are not source code', async () => {
  const root = parseIntoFsdRoot(
    `
      📂 shared
        📂 styles
          📄 index.css
    `,
    joinFromRoot('src'),
  )

  expect((await noWildcardExports.check(root)).diagnostics).toEqual([])
})
