import { expect, it } from 'vitest'

import noSegmentlessSlices from './index.js'
import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'

it('reports no errors on a project where every slice has at least one segment', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.ts
      📂 i18n
        📄 index.ts
    📂 entities
      📂 user
        📂 ui
          📄 Name.tsx
        📂 api
          📄 useCurrentUser.ts
        📄 index.ts
      📂 document
        📂 api
          📄 useDocument.ts
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
  `)

  expect(noSegmentlessSlices.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project where some slices have no segments', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.ts
      📂 i18n
        📄 index.ts
    📂 entities
      📂 user
        📄 index.ts
        📄 Name.tsx
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
      📂 settings
        📂 profile
          📄 ProfilePage.tsx
          📄 index.ts
  `)

  const diagnostics = noSegmentlessSlices.check(root).diagnostics
  expect(diagnostics).toEqual([
    {
      message: 'This slice has no segments. Consider dividing the code inside into segments.',
      location: { path: joinFromRoot('entities', 'user') },
    },
    {
      message: 'This slice has no segments. Consider dividing the code inside into segments.',
      location: { path: joinFromRoot('pages', 'settings', 'profile') },
    },
  ])
})
