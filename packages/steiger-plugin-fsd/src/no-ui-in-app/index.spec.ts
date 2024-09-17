import { expect, it } from 'vitest'

import noUiInApp from './index.js'
import { joinFromRoot, parseIntoFsdRoot } from '../_lib/prepare-test.js'

it('reports no errors on a project without "ui" segment in "app" layer', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.ts
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
    📂 app
      📂 providers
        📄 index.ts
  `)

  expect(noUiInApp.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with "ui" segment in "app" layer', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.ts
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
    📂 app
      📂 providers
        📄 index.ts
      📂 ui
        📄 index.ts
  `)

  const diagnostics = noUiInApp.check(root).diagnostics
  expect(diagnostics).toEqual([
    {
      message: 'Layer "app" should not have "ui" segment.',
      location: { path: joinFromRoot('app', 'ui') },
    },
  ])
})
