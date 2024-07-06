import { expect, it } from 'vitest'

import { joinFromRoot, parseIntoFsdRoot } from '../_lib/prepare-test.js'
import excessiveSlicing from './index.js'

it('reports no errors on projects with moderate slicing', () => {
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

it('reports errors on a project with an excessive amount of features', () => {
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
    📂 features
      📂 comments
        📂 ui
        📄 index.ts
      📂 posts
        📂 ui
        📄 index.ts
      📂 users
        📂 ui
        📄 index.ts
      📂 cars
        📂 ui
        📄 index.ts
      📂 alligators
        📂 ui
        📄 index.ts
      📂 whales
        📂 ui
        📄 index.ts
      📂 giraffes
        📂 ui
        📄 index.ts
      📂 buses
        📂 ui
        📄 index.ts
      📂 trains
        📂 ui
        📄 index.ts
      📂 planes
        📂 ui
        📄 index.ts
      📂 boats
        📂 ui
        📄 index.ts
      📂 submarines
        📂 ui
        📄 index.ts
      📂 helicopters
        📂 ui
        📄 index.ts
      📂 rockets
        📂 ui
        📄 index.ts
      📂 satellites
        📂 ui
        📄 index.ts
      📂 space-stations
        📂 ui
        📄 index.ts
      📂 planets
        📂 ui
        📄 index.ts
      📂 galaxies
        📂 ui
        📄 index.ts
      📂 universes
        📂 ui
        📄 index.ts
      📂 multiverses
        📂 ui
        📄 index.ts
      📂 metaverses
        📂 ui
        📄 index.ts
      📂 ai
        📂 ui
        📄 index.ts
      📂 bitcoin
        📂 ui
        📄 index.ts
  `)

  const { diagnostics } = excessiveSlicing.check(root)

  expect(diagnostics).toEqual([
    {
      location: { path: joinFromRoot('features') },
      message:
        'Layer "features" has 23 ungrouped slices, which is above the recommended threshold of 20. Consider grouping them or moving the code inside to the layer where it\'s used.',
    },
  ])
})

it('works with slice groups', () => {
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
    📂 features
      📂 legit-feature
        📂 ui
        📄 index.ts
      📂 junk
        📂 comments
          📂 ui
          📄 index.ts
        📂 posts
          📂 ui
          📄 index.ts
        📂 users
          📂 ui
          📄 index.ts
        📂 cars
          📂 ui
          📄 index.ts
        📂 alligators
          📂 ui
          📄 index.ts
        📂 whales
          📂 ui
          📄 index.ts
        📂 giraffes
          📂 ui
          📄 index.ts
        📂 buses
          📂 ui
          📄 index.ts
        📂 trains
          📂 ui
          📄 index.ts
        📂 planes
          📂 ui
          📄 index.ts
        📂 boats
          📂 ui
          📄 index.ts
        📂 submarines
          📂 ui
          📄 index.ts
        📂 helicopters
          📂 ui
          📄 index.ts
        📂 rockets
          📂 ui
          📄 index.ts
        📂 satellites
          📂 ui
          📄 index.ts
        📂 space-stations
          📂 ui
          📄 index.ts
        📂 planets
          📂 ui
          📄 index.ts
        📂 galaxies
          📂 ui
          📄 index.ts
        📂 universes
          📂 ui
          📄 index.ts
        📂 multiverses
          📂 ui
          📄 index.ts
        📂 metaverses
          📂 ui
          📄 index.ts
        📂 ai
          📂 ui
          📄 index.ts
        📂 bitcoin
          📂 ui
          📄 index.ts
  `)

  const { diagnostics } = excessiveSlicing.check(root)

  expect(diagnostics).toEqual([
    {
      location: { path: joinFromRoot('features', 'junk') },
      message:
        'Slice group "junk" has 23 slices, which is above the recommended threshold of 20. Consider grouping them or moving the code inside to the layer where it\'s used.',
    },
  ])
})
