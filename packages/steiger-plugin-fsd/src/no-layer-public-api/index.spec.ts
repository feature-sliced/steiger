import { expect, it } from 'vitest'

import noLayerPublicApi from './index.js'
import { parseIntoFsdRoot } from '../_lib/prepare-test.js'

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
  `)

  const diagnostics = noLayerPublicApi.check(root).diagnostics
  expect(diagnostics).toEqual([{ message: 'Layer "shared" should not have an index file' }, { message: 'Layer "pages" should not have an index file'}])
})
