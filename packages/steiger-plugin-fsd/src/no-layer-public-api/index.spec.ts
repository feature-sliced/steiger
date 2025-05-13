import { expect, it } from 'vitest'

import noLayerPublicApi from './index.js'
import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'

it('reports no errors on a project without index files on layer level', () => {
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

  expect(noLayerPublicApi.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with index files on layer level', () => {
  const root = parseIntoFsdRoot(
    `
    📂 shared
      📂 ui
        📄 index.ts
      📄 index.ts
    📂 entities
      📂 user
        📂 ui
        📄 index.ts
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
      📂 editor
        📂 ui
        📄 index.ts
      📄 index.ts
    📂 app
      📂 ui
        📄 index.ts
      📄 index.ts
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = noLayerPublicApi.check(root).diagnostics
  expect(diagnostics).toEqual([
    {
      message: 'Layer "shared" should not have an index file',
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'shared', 'index.ts') },
    },
    {
      message: 'Layer "pages" should not have an index file',
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'pages', 'index.ts') },
    },
  ])
})
