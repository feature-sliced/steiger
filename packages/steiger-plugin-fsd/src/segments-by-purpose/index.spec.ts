import { expect, it } from 'vitest'

import segmentsByPurpose from './index.js'
import { compareMessages, joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'

it('reports no errors on a project with good segments', () => {
  const root = parseIntoFsdRoot(
    `
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
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect(segmentsByPurpose.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with bad segments', () => {
  const root = parseIntoFsdRoot(
    `
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
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = segmentsByPurpose.check(root).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'user', 'components') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'shared', 'helpers') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'shared', 'hooks') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'shared', 'modals') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'shared', 'utils') },
    },
  ])
})
