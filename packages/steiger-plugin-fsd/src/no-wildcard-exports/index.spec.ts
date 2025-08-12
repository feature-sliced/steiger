import { expect, it } from 'vitest'
import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'
import type { Folder, File } from '@steiger/toolkit'

import noWildcardExports from './index.js'

type FileWithContent = File & { content?: string }

it('reports no errors on a project with valid exports', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 Button.tsx
        📄 index.ts
    📂 entities
      📂 user
        📂 ui
          📄 UserCard.tsx
          📄 index.ts
        📄 index.ts
    📂 features
      📂 auth
        📂 ui
          📄 LoginForm.tsx
          📄 index.ts
  `)

  function addContentToFiles(folder: Folder): void {
    for (const child of folder.children) {
      if (child.type === 'file') {
        const fileWithContent = child as FileWithContent
        if (child.path.endsWith('shared/ui/index.ts')) {
          fileWithContent.content = "export { Button } from './Button'"
        } else if (child.path.endsWith('entities/user/ui/index.ts')) {
          fileWithContent.content = "export { UserCard } from './UserCard'"
        } else if (child.path.endsWith('entities/user/index.ts')) {
          fileWithContent.content = "export * as userModel from './model'"
        } else if (child.path.endsWith('features/auth/ui/index.ts')) {
          fileWithContent.content = "export { LoginForm } from './LoginForm'"
        } else {
          fileWithContent.content = ''
        }
      } else if (child.type === 'folder') {
        addContentToFiles(child)
      }
    }
  }

  addContentToFiles(root)

  expect(noWildcardExports.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with wildcard exports', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 Button.tsx
        📄 index.ts
    📂 entities
      📂 user
        📂 ui
          📄 UserCard.tsx
          📄 index.ts
        📄 index.ts
  `)

  function addContentToFiles(folder: Folder): void {
    for (const child of folder.children) {
      if (child.type === 'file') {
        const fileWithContent = child as FileWithContent
        if (child.path.endsWith('shared/ui/index.ts')) {
          fileWithContent.content = "export * from './Button'"
        } else if (child.path.endsWith('entities/user/ui/index.ts')) {
          fileWithContent.content = "export * from './UserCard'"
        } else {
          fileWithContent.content = ''
        }
      } else if (child.type === 'folder') {
        addContentToFiles(child)
      }
    }
  }

  addContentToFiles(root)

  const diagnostics = noWildcardExports.check(root).diagnostics
  expect(diagnostics).toEqual([
    {
      message: 'Wildcard exports are not allowed in public APIs. Use named exports instead.',
      location: { path: joinFromRoot('entities', 'user', 'ui', 'index.ts') },
      fixes: [
        {
          type: 'modify-file',
          path: joinFromRoot('entities', 'user', 'ui', 'index.ts'),
          content: '// Replace with named exports\n// Example: export { ComponentA, ComponentB } from "./components"',
        },
      ],
    },
  ])
})

it('allows export * as namespace pattern', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 positions.ts
        📄 index.ts
    📂 entities
      📂 user
        📄 model.ts
        📄 index.ts
  `)

  function addContentToFiles(folder: Folder): void {
    for (const child of folder.children) {
      if (child.type === 'file') {
        const fileWithContent = child as FileWithContent
        if (child.path.endsWith('shared/ui/index.ts')) {
          fileWithContent.content = "export * as positions from './positions'"
        } else if (child.path.endsWith('entities/user/index.ts')) {
          fileWithContent.content = "export * as userModel from './model'"
        } else {
          fileWithContent.content = ''
        }
      } else if (child.type === 'folder') {
        addContentToFiles(child)
      }
    }
  }

  addContentToFiles(root)

  expect(noWildcardExports.check(root)).toEqual({ diagnostics: [] })
})

it('ignores wildcard exports in non-public files', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 internal.ts
        📄 index.ts
    📂 entities
      📂 user
        📂 ui
          📄 internal-utils.ts
          📄 index.ts
  `)

  function addContentToFiles(folder: Folder): void {
    for (const child of folder.children) {
      if (child.type === 'file') {
        const fileWithContent = child as FileWithContent
        if (child.path.endsWith('internal.ts')) {
          fileWithContent.content = "export * from './components'"
        } else if (child.path.endsWith('internal-utils.ts')) {
          fileWithContent.content = "export * from './utils'"
        } else {
          fileWithContent.content = ''
        }
      } else if (child.type === 'folder') {
        addContentToFiles(child)
      }
    }
  }

  addContentToFiles(root)

  expect(noWildcardExports.check(root)).toEqual({ diagnostics: [] })
})

it('ignores wildcard exports in test files', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 Button.test.ts
        📄 index.ts
    📂 entities
      📂 user
        📂 ui
          📄 UserCard.spec.ts
          📄 index.ts
  `)

  function addContentToFiles(folder: Folder): void {
    for (const child of folder.children) {
      if (child.type === 'file') {
        const fileWithContent = child as FileWithContent
        if (child.path.endsWith('Button.test.ts')) {
          fileWithContent.content = "export * from './test-utils'"
        } else if (child.path.endsWith('UserCard.spec.ts')) {
          fileWithContent.content = "export * from './test-utils'"
        } else {
          fileWithContent.content = ''
        }
      } else if (child.type === 'folder') {
        addContentToFiles(child)
      }
    }
  }

  addContentToFiles(root)

  expect(noWildcardExports.check(root)).toEqual({ diagnostics: [] })
})

it('allows wildcard exports in unsliced layers (shared and app)', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 Button.tsx
        📄 Modal.tsx
        📄 index.ts
      📂 api
        📄 client.ts
        📄 endpoints.ts
        📄 index.ts
    📂 app
      📂 providers
        📄 AuthProvider.tsx
        📄 ThemeProvider.tsx
        📄 index.ts
      📂 routes
        📄 index.ts
    📂 entities
      📂 user
        📂 ui
          📄 UserCard.tsx
          📄 index.ts
  `)

  function addContentToFiles(folder: Folder): void {
    for (const child of folder.children) {
      if (child.type === 'file') {
        const fileWithContent = child as FileWithContent
        if (child.path.endsWith('shared/ui/index.ts')) {
          fileWithContent.content = "export * from './Button'\nexport * from './Modal'"
        } else if (child.path.endsWith('shared/api/index.ts')) {
          fileWithContent.content = "export * from './client'\nexport * from './endpoints'"
        } else if (child.path.endsWith('app/providers/index.ts')) {
          fileWithContent.content = "export * from './AuthProvider'\nexport * from './ThemeProvider'"
        } else if (child.path.endsWith('app/routes/index.ts')) {
          fileWithContent.content = "export * from './home'\nexport * from './auth'"
        } else if (child.path.endsWith('entities/user/ui/index.ts')) {
          fileWithContent.content = "export { UserCard } from './UserCard'"
        } else {
          fileWithContent.content = ''
        }
      } else if (child.type === 'folder') {
        addContentToFiles(child)
      }
    }
  }

  addContentToFiles(root)

  expect(noWildcardExports.check(root)).toEqual({ diagnostics: [] })
})
