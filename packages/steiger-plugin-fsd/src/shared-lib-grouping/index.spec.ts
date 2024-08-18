import { expect, it } from 'vitest'

import { joinFromRoot, parseIntoFsdRoot } from '../_lib/prepare-test.js'
import excessiveSlicing from './index.js'

it('reports no errors on projects with no shared/lib', () => {
  const root = parseIntoFsdRoot(`
    📂 entities
      📂 users
        📂 ui
        📄 index.ts
      📂 posts
        📂 ui
        📄 index.ts
    📂 shared
      📂 ui
        📄 index.ts
        📄 Button.tsx
  `)

  const { diagnostics } = excessiveSlicing.check(root)

  expect(diagnostics).toEqual([])
})

it('reports no errors on projects with shared/lib below threshold', () => {
  const root = parseIntoFsdRoot(`
    📂 entities
      📂 users
        📂 ui
        📄 index.ts
      📂 posts
        📂 ui
        📄 index.ts
    📂 shared
      📂 ui
        📄 index.ts
        📄 Button.tsx
      📂 lib
        📄 index.ts
        📄 dates.ts
        📄 collections.ts
  `)

  const { diagnostics } = excessiveSlicing.check(root)

  expect(diagnostics).toEqual([])
})

it('reports errors on a project with shared/lib above threshold', () => {
  const root = parseIntoFsdRoot(`
    📂 entities
      📂 users
        📂 ui
        📄 index.ts
      📂 posts
        📂 ui
        📄 index.ts
    📂 shared
      📂 ui
        📄 index.ts
        📄 Button.tsx
      📂 lib
        📄 index.ts
        📄 dates.ts
        📄 collections.ts
        📄 utils.ts
        📄 helpers.ts
        📄 constants.ts
        📄 types.ts
        📄 api.ts
        📄 hooks.ts
        📄 selectors.ts
        📄 actions.ts
        📄 reducers.ts
        📄 sagas.ts
        📄 middleware.ts
        📄 components.ts
        📄 hell.ts
        📄 is.ts
        📄 other.ts
        📄 people.ts
  `)

  const { diagnostics } = excessiveSlicing.check(root)

  expect(diagnostics).toEqual([
    {
      message: 'Shared/lib has 19 modules, which is above the recommended threshold of 15. Consider grouping them.',
      location: { path: joinFromRoot('shared', 'lib') },
    },
  ])
})
