import { expect, it } from 'vitest'
import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit'

import noUiInApp from './index.js'

it('reports no errors on a project without the "ui" segment on the "app" layer', () => {
  const root = parseIntoFsdRoot(
    `
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
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect(noUiInApp.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with the "ui" segment on the "app" layer', () => {
  const root = parseIntoFsdRoot(
    `
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
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = noUiInApp.check(root).diagnostics
  expect(diagnostics).toEqual([
    {
      message: 'Layer "app" should not have "ui" segment.',
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'app', 'ui') },
    },
  ])
})
