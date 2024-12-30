import { expect, it } from 'vitest'

import { compareMessages, joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit'
import inconsistentNaming from './index.js'

it('reports no errors on slice names that are pluralized consistently', () => {
  const root = parseIntoFsdRoot(
    `
    📂 entities
      📂 users
        📂 ui
        📄 index.ts
      📂 posts
        📂 ui
        📄 index.ts
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect(inconsistentNaming.check(root)).toEqual({ diagnostics: [] })
})

it('reports an error on slice names that are not pluralized consistently', () => {
  const root = parseIntoFsdRoot(
    `
    📂 entities
      📂 user
        📂 ui
        📄 index.ts
      📂 posts
        📂 ui
        📄 index.ts
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = inconsistentNaming.check(root).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    {
      message: 'Inconsistent pluralization of slice names. Prefer all plural names',
      fixes: [
        {
          type: 'rename',
          path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'user'),
          newName: 'users',
        },
      ],
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'entities') },
    },
  ])
})

it('prefers the singular form when there are more singular slices', () => {
  const root = parseIntoFsdRoot(
    `
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
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = inconsistentNaming.check(root).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    {
      message: 'Inconsistent pluralization of slice names. Prefer all singular names',
      fixes: [
        {
          type: 'rename',
          path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'comments'),
          newName: 'comment',
        },
      ],
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'entities') },
    },
  ])
})
