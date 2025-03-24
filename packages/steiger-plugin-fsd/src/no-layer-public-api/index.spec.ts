import { expect, it } from 'vitest'

import noLayerPublicApi from './index.js'
import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'

it('reports no errors on a project without index files on layer level', () => {
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

  expect(noLayerPublicApi.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with index files on layer level', () => {
  const root = parseIntoFsdRoot(`
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
  `)

  const diagnostics = noLayerPublicApi.check(root).diagnostics
  expect(diagnostics).toEqual([
    { message: 'Layer "shared" should not have an index file', location: { path: joinFromRoot('shared', 'index.ts') } },
    { message: 'Layer "pages" should not have an index file', location: { path: joinFromRoot('pages', 'index.ts') } },
  ])
})

it('reports errors on a project with multiple index files on layer level', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.ts
        📄 index.js
      📄 index.js
    📂 entities
      📂 user
        📂 ui
        📄 index.js
    📂 pages
      📂 home
        📂 ui
        📄 index.js
      📂 editor
        📂 ui
        📄 index.ts
        📄 index.js
      📄 index.client.js
      📄 index.server.js
  `)

  const diagnostics = noLayerPublicApi.check(root).diagnostics
  expect(diagnostics).toEqual([
    { message: 'Layer "shared" should not have an index file', location: { path: joinFromRoot('shared', 'index.js') } },
    {
      message: 'Layer "pages" should not have an index file',
      location: { path: joinFromRoot('pages', 'index.client.js') },
    },
    {
      message: 'Layer "pages" should not have an index file',
      location: { path: joinFromRoot('pages', 'index.server.js') },
    },
  ])
})

it('reports no errors on a project with multiple index files in valid locations', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.js
      📂 lib
        📄 index.js
    📂 entities
      📂 user
        📂 ui
        📄 index.js
    📂 pages
      📂 home
        📂 ui
        📄 index.client.js
        📄 index.server.js
      📂 editor
        📂 ui
        📄 index.js
  `)

  expect(noLayerPublicApi.check(root)).toEqual({ diagnostics: [] })
})
