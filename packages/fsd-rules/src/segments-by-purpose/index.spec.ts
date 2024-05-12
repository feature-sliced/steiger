import { expect, it } from 'vitest'

import segmentsByPurpose from '.'
import { parseIntoFsdRoot } from '../prepare-test'

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

  expect(segmentsByPurpose.check(root)).toEqual({ errors: [] })
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

  const errors = segmentsByPurpose.check(root).errors.sort()
  expect(errors).toEqual([
    'Non-descriptive segment name: components',
    'Non-descriptive segment name: helpers',
    'Non-descriptive segment name: hooks',
    'Non-descriptive segment name: modals',
    'Non-descriptive segment name: utils',
  ])
})
