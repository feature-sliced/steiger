import { expect, it } from 'vitest'

import noProcesses from './index.js'
import { joinFromRoot, parseIntoFsdRoot } from '../_lib/prepare-test.js'

it('reports no errors on a project without the Processes layer', () => {
  const root = parseIntoFsdRoot(`
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
  `)

  expect(noProcesses.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with the Processes layer', () => {
  const root = parseIntoFsdRoot(`
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
  `)

  const diagnostics = noProcesses.check(root).diagnostics
  expect(diagnostics).toEqual([
    {
      message: 'Layer "processes" is deprecated, avoid using it',
      location: { path: joinFromRoot('processes'), type: 'folder' },
    },
  ])
})
