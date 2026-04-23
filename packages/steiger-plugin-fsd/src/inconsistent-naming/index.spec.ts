import { expect, it } from 'vitest'

import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'
import inconsistentNaming from './index.js'

it('reports no errors on entity names that are pluralized consistently', () => {
  const root1 = parseIntoFsdRoot(
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
  const root2 = parseIntoFsdRoot(
    `
    📂 entities
      📂 user
        📂 ui
        📄 index.ts
      📂 post
        📂 ui
        📄 index.ts
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect(inconsistentNaming.check(root1)).toEqual({ diagnostics: [] })
  expect(inconsistentNaming.check(root2)).toEqual({ diagnostics: [] })
})

it('reports no errors on multi-word entity names that are pluralized consistently', () => {
  const root = parseIntoFsdRoot(
    `
    📂 entities
      📂 admin-users
        📂 ui
        📄 index.ts
      📂 employers-of-record
        📂 ui
        📄 index.ts
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect(inconsistentNaming.check(root)).toEqual({ diagnostics: [] })
})

it('reports an error on entity names that are not pluralized consistently', () => {
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

  const diagnostics = inconsistentNaming.check(root).diagnostics
  expect(diagnostics).toEqual([
    {
      message: 'Inconsistent pluralization of entity names. Prefer all singular names.',
      fixes: [
        {
          type: 'rename',
          path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'posts'),
          newName: 'post',
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
      📂 admin-user
        📂 ui
        📄 index.ts
      📂 news-post
        📂 ui
        📄 index.ts
      📂 comments
        📂 ui
        📄 index.ts
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = inconsistentNaming.check(root).diagnostics
  expect(diagnostics).toEqual([
    {
      message: 'Inconsistent pluralization of entity names. Prefer all singular names.',
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

it('recognizes the special case when there is a plural and singular form of the same name', () => {
  const root = parseIntoFsdRoot(
    `
    📂 entities
      📂 admin-user
        📂 ui
        📄 index.ts
      📂 admin-users
        📂 ui
        📄 index.ts
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = inconsistentNaming.check(root).diagnostics
  expect(diagnostics).toEqual([
    {
      message: 'Avoid having both "admin-user" and "admin-users" entities.',
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'admin-user') },
    },
  ])
})

it('allows inconsistency between different slice groups', () => {
  const root = parseIntoFsdRoot(
    `
    📂 entities
      📂 admin-user
        📂 ui
        📄 index.ts
      📂 group
        📄 index.ts
      📂 post-parts
        📂 posts
          📄 index.ts
        📂 authors
          📄 index.ts
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = inconsistentNaming.check(root).diagnostics
  expect(diagnostics).toEqual([])
})

it('does not consider uncountable words as plural', () => {
  const root = parseIntoFsdRoot(
    `
    📂 entities
      📂 user
        📂 ui
        📄 index.ts
      📂 firmware
        📂 ui
        📄 index.ts
      📂 hardware
        📂 ui
        📄 index.ts
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = inconsistentNaming.check(root).diagnostics
  expect(diagnostics).toEqual([])
})
