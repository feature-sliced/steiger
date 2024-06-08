import { expect, it } from 'vitest'

import ambiguousSliceNames from './index.js'
import { parseIntoFsdRoot } from '../_lib/prepare-test.js'

it('reports no errors on a project without slice names that match some segment name in Shared', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.ts
      📂 i18n
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

  expect(ambiguousSliceNames.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with slice names that match some segment name in Shared', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.ts
      📂 i18n
        📄 index.ts
    📂 entities
      📂 user
        📂 ui
        📂 model
        📄 index.ts
    📂 features
      📂 i18n
        📂 ui
        📄 index.ts
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
  `)

  const diagnostics = ambiguousSliceNames.check(root).diagnostics
  expect(diagnostics).toEqual([
    { message: 'Slice name "i18n" on layer "features" is ambiguous with a segment name in Shared' },
  ])
})
