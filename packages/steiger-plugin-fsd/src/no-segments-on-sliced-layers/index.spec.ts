import { describe, expect, it } from 'vitest'

import noSegmentsOnSlicedLayers from './index.js'
import { joinFromRoot, parseIntoFsdRoot } from '../_lib/prepare-test.js'

describe('no-segments-on-sliced-layers rule', () => {
  it('reports no errors on a project where the sliced layers has no segments in direct children', () => {
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

    console.log(noSegmentsOnSlicedLayers.check(root))

    expect(noSegmentsOnSlicedLayers.check(root)).toEqual({ diagnostics: [] })
  })

  it('reports errors on a project where the "Entities" layer has segments in direct children', () => {
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
        📂 ui
          📄 index.ts
      📂 features
        📂 user
          📂 ui
            📄 LogIn.tsx
            📄 index.ts
          📄 index.ts
        📂 api
          📄 index.ts
      📂 widgets
        📂 footer
          📂 ui
            📄 Footer.tsx
            📄 index.ts
          📄 index.ts
        📂 config
          📄 index.ts
      📂 pages
        📂 home
          📂 ui
          📄 index.ts
        📂 settings
          📂 profile
            📄 ProfilePage.tsx
            📄 index.ts
        📂 lib
          📄 index.ts
    `)

    const diagnostics = noSegmentsOnSlicedLayers.check(root).diagnostics
    console.log(diagnostics)
    expect(diagnostics).toEqual([
      {
        message:
          'Conventional segment "ui" found as a direct child of a sliced layer. Consider moving it inside a slice or to another layer.',
        location: { path: joinFromRoot('entities', 'ui') },
      },
      {
        message:
          'Conventional segment "api" found as a direct child of a sliced layer. Consider moving it inside a slice or to another layer.',
        location: { path: joinFromRoot('features', 'api') },
      },
      {
        message:
          'Conventional segment "config" found as a direct child of a sliced layer. Consider moving it inside a slice or to another layer.',
        location: { path: joinFromRoot('widgets', 'config') },
      },
      {
        message:
          'Conventional segment "lib" found as a direct child of a sliced layer. Consider moving it inside a slice or to another layer.',
        location: { path: joinFromRoot('pages', 'lib') },
      },
    ])
  })
})
