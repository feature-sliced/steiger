import { expect, it } from 'vitest'

import noProcesses from './index.js'
import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'

it('reports no errors on a project without the Processes layer', () => {
  const root = parseIntoFsdRoot(
    `
    📂 shared
      📂 ui
        📄 index.ts
      📂 lib
        📄 index.ts
    📂 entities
      📂 user
        📂 ui
        📂 model
        📄 index.ts
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect(noProcesses.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with the Processes layer', () => {
  const root = parseIntoFsdRoot(
    `
    📂 shared
      📂 ui
        📄 index.ts
      📂 lib
        📄 index.ts
    📂 entities
      📂 user
        📂 ui
        📂 model
        📄 index.ts
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
    📂 processes
      📂 cart
        📂 ui
        📄 index.ts
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = noProcesses.check(root).diagnostics
  expect(diagnostics).toEqual([
    {
      message: 'Layer "processes" is deprecated, avoid using it',
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'processes') },
    },
  ])
})
