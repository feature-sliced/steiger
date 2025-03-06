import { join } from 'node:path'
import { expect, it } from 'vitest'

import ambiguousSliceNames from './index.js'
import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'

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
    {
      message: 'Slice "i18n" could be confused with a segment from Shared with the same name',
      location: { path: joinFromRoot('features', 'i18n') },
    },
  ])
})

it('works for slice groups and grouped slices', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.ts
      📂 i18n
        📄 index.ts
      📂 store
        📄 index.ts
    📂 features
      📂 i18n
        📂 grouped
          📂 ui
          📄 index.ts
      📂 test
        📂 store
          📂 ui
          📄 index.ts
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
  `)

  const diagnostics = ambiguousSliceNames.check(root).diagnostics
  expect(diagnostics).toEqual([
    {
      message: 'Slice group "i18n" could be confused with a segment "i18n" from Shared',
      location: { path: joinFromRoot('features', 'i18n') },
    },
    {
      message: `Slice "${join('test', 'store')}" could be confused with a segment "store" from Shared`,
      location: { path: joinFromRoot('features', 'test', 'store') },
    },
  ])
})
