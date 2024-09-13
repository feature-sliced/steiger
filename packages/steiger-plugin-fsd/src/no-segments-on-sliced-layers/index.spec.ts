import { describe, expect, it } from 'vitest'

import noSegmentsOnSlicedLayers from './index.js'
import { joinFromRoot, parseIntoFsdRoot, compareMessages } from '../_lib/prepare-test.js'

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

    expect(noSegmentsOnSlicedLayers.check(root)).toEqual({ diagnostics: [] })
  })

  it('reports errors on a project where a sliced layer has segments among its direct children', () => {
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

    const diagnostics = noSegmentsOnSlicedLayers.check(root).diagnostics.sort(compareMessages)

    expect(diagnostics).toEqual([
      {
        message:
          'Conventional segment "api" should not be a direct child of a sliced layer. Consider moving it inside a slice or, if that is a slice, consider a different name for it to avoid confusion with segments.',
        location: { path: joinFromRoot('features', 'api'), type: 'folder' },
      },
      {
        message:
          'Conventional segment "config" should not be a direct child of a sliced layer. Consider moving it inside a slice or, if that is a slice, consider a different name for it to avoid confusion with segments.',
        location: { path: joinFromRoot('widgets', 'config'), type: 'folder' },
      },
      {
        message:
          'Conventional segment "lib" should not be a direct child of a sliced layer. Consider moving it inside a slice or, if that is a slice, consider a different name for it to avoid confusion with segments.',
        location: { path: joinFromRoot('pages', 'lib'), type: 'folder' },
      },
      {
        message:
          'Conventional segment "ui" should not be a direct child of a sliced layer. Consider moving it inside a slice or, if that is a slice, consider a different name for it to avoid confusion with segments.',
        location: { path: joinFromRoot('entities', 'ui'), type: 'folder' },
      },
    ])
  })
})
