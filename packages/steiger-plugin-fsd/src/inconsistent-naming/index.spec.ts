import { expect, it } from 'vitest'

import { compareMessages, joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'
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
      message: 'Inconsistent pluralization of slice names. Prefer all plural names',
      fixes: [
        {
          type: 'rename',
          path: joinFromRoot('entities', 'user'),
          newName: 'users',
        },
      ],
      location: { path: joinFromRoot('entities') },
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
      message: 'Inconsistent pluralization of slice names. Prefer all singular names',
      fixes: [
        {
          type: 'rename',
          path: joinFromRoot('entities', 'comments'),
          newName: 'comment',
        },
      ],
      location: { path: joinFromRoot('entities') },
    },
  ])
})

it('ignores neutral words like k8s and kubernetes when checking pluralization', () => {
  const root = parseIntoFsdRoot(`
    📂 entities
      📂 user
        📂 ui
        📄 index.ts
      📂 k8s
        📂 ui
        📄 index.ts
      📂 kubernetes
        📂 ui
        📄 index.ts
  `)

  expect(inconsistentNaming.check(root)).toEqual({ diagnostics: [] })
})

it('ignores uncountable words like media when checking pluralization', () => {
  const root = parseIntoFsdRoot(`
    📂 entities
      📂 user
        📂 ui
        📄 index.ts
      📂 media
        📂 ui
        📄 index.ts
  `)

  expect(inconsistentNaming.check(root)).toEqual({ diagnostics: [] })
})
