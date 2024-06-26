import { expect, it } from 'vitest'

import { compareMessages, parseIntoFsdRoot, joinFromRoot } from '../_lib/prepare-test.js'
import inconsistentNaming from './index.js'

it('reports no errors on slice names that are pluralized consistently', () => {
  const root = parseIntoFsdRoot(`
    📂 entities
      📂 users
        📂 ui
        📄 index.ts
      📂 posts
        📂 ui
        📄 index.ts
  `)

  expect(inconsistentNaming.check(root)).toEqual({ diagnostics: [] })
})

it('reports an error on slice names that are not pluralized consistently', () => {
  const root = parseIntoFsdRoot(`
    📂 entities
      📂 user
        📂 ui
        📄 index.ts
      📂 posts
        📂 ui
        📄 index.ts
  `)

  const diagnostics = inconsistentNaming.check(root).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    {
      message: 'Inconsistent pluralization on layer "entities". Prefer all plural names',
      fixes: [
        {
          type: 'rename',
          path: joinFromRoot('entities', 'user'),
          newName: 'users',
        },
      ],
    },
  ])
})

it('prefers the singular form when there are more singular slices', () => {
  const root = parseIntoFsdRoot(`
    📂 entities
      📂 user
        📂 ui
        📄 index.ts
      📂 post
        📂 ui
        📄 index.ts
      📂 comments
        📂 ui
        📄 index.ts
  `)

  const diagnostics = inconsistentNaming.check(root).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    {
      message: 'Inconsistent pluralization on layer "entities". Prefer all singular names',
      fixes: [
        {
          type: 'rename',
          path: joinFromRoot('entities', 'comments'),
          newName: 'comment',
        },
      ],
    },
  ])
})
