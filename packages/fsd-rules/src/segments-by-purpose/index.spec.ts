import { expect, it } from 'vitest'

import segmentsByPurpose from '.'
import { compareMessages, parseIntoFsdRoot } from '../_lib/prepare-test'

it('reports no errors on a project with good segments', () => {
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

  expect(segmentsByPurpose.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with bad segments', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.ts
      📂 modals
        📄 index.ts
      📂 hooks
        📄 index.ts
      📂 helpers
        📄 index.ts
      📂 utils
        📄 index.ts
    📂 entities
      📂 user
        📂 components
        📂 model
        📄 index.ts
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
  `)

  const diagnostics = segmentsByPurpose.check(root).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    { message: 'Non-descriptive segment name: components' },
    { message: 'Non-descriptive segment name: helpers' },
    { message: 'Non-descriptive segment name: hooks' },
    { message: 'Non-descriptive segment name: modals' },
    { message: 'Non-descriptive segment name: utils' },
  ])
})
