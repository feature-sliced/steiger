import { expect, it } from 'vitest'

import publicApi from './index.js'
import { compareMessages, joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit'

it('reports no errors on a project with all the required public APIs', () => {
  const root = parseIntoFsdRoot(
    `
    📂 shared
      📂 ui
        📄 index.ts
    📂 entities
      📂 users
        📂 ui
        📄 index.ts
      📂 posts
        📂 ui
        📄 index.ts
    📂 features
      📂 comments
        📂 ui
        📄 index.ts
    📂 pages
      📂 editor
        📄 index.ts
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect(publicApi.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on slices that are missing a public API', () => {
  const root = parseIntoFsdRoot(
    `
    📂 shared
      📂 ui
        📄 index.ts
    📂 entities
      📂 users
        📂 ui
        📄 index.ts
      📂 posts
        📂 ui
    📂 features
      📂 comments
        📂 ui
        📄 index.ts
    📂 pages
      📂 editor
        📂 ui
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = publicApi.check(root).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    {
      message: 'This slice is missing a public API.',
      fixes: [
        {
          type: 'create-file',
          path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'posts', 'index.js'),
          content: '',
        },
      ],
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'entities', 'posts') },
    },
    {
      message: 'This slice is missing a public API.',
      fixes: [
        {
          type: 'create-file',
          path: joinFromRoot('users', 'user', 'project', 'src', 'pages', 'editor', 'index.js'),
          content: '',
        },
      ],
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'pages', 'editor') },
    },
  ])
})

it('reports errors on segments that are missing a public API', () => {
  const root = parseIntoFsdRoot(
    `
    📂 shared
      📂 ui
        📄 button.ts
      📂 config
        📄 envs.ts
    📂 entities
      📂 users
        📂 ui
        📄 index.ts
      📂 posts
        📂 ui
        📄 index.ts
    📂 features
      📂 comments
        📂 ui
        📄 index.ts
    📂 pages
      📂 editor
        📂 ui
        📄 index.ts
    📂 app
      📂 providers
      📂 styles
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = publicApi.check(root).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    {
      message: 'This segment is missing a public API.',
      fixes: [
        {
          type: 'create-file',
          path: joinFromRoot('users', 'user', 'project', 'src', 'shared', 'config', 'index.js'),
          content: '',
        },
      ],
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'shared', 'config') },
    },
  ])
})

it('reports errors on top-level folders in shared/lib and shared/ui that are missing a public API', () => {
  const root = parseIntoFsdRoot(
    `
    📂 shared
      📂 ui
        📄 index.ts
        📂 button
        📂 text-field
      📂 lib
        📂 dates
          📄 index.ts
        📂 arrays
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = publicApi.check(root).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    {
      fixes: [
        {
          content: '',
          path: joinFromRoot('users', 'user', 'project', 'src', 'shared', 'lib', 'arrays', 'index.js'),
          type: 'create-file',
        },
      ],
      location: {
        path: joinFromRoot('users', 'user', 'project', 'src', 'shared', 'lib', 'arrays'),
      },
      message: 'This top-level folder in shared/lib is missing a public API.',
    },
  ])
})
