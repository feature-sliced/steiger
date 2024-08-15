import { expect, it } from 'vitest'

import publicApi from './index.js'
import { compareMessages, joinFromRoot, parseIntoFsdRoot } from '../_lib/prepare-test.js'
import { Context } from '@steiger/types'

const dummyContext: Context = { sourceFileExtension: 'ts' }

it('reports no errors on a project with all the required public APIs', () => {
  const root = parseIntoFsdRoot(`
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
  `)

  expect(publicApi.check.call(dummyContext, root)).toEqual({ diagnostics: [] })
})

it('reports errors on slices that are missing a public API', () => {
  const root = parseIntoFsdRoot(`
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
  `)

  const diagnostics = publicApi.check.call(dummyContext, root).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    {
      message: 'This slice is missing a public API.',
      fixes: [
        {
          type: 'create-file',
          path: joinFromRoot('entities', 'posts', 'index.ts'),
          content: '',
        },
      ],
      location: { path: joinFromRoot('entities', 'posts') },
    },
    {
      message: 'This slice is missing a public API.',
      fixes: [
        {
          type: 'create-file',
          path: joinFromRoot('pages', 'editor', 'index.ts'),
          content: '',
        },
      ],
      location: { path: joinFromRoot('pages', 'editor') },
    },
  ])
})

it('reports errors on segments that are missing a public API', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
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
  `)

  const diagnostics = publicApi.check.call(dummyContext, root).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    {
      message: 'This segment is missing a public API.',
      fixes: [
        {
          type: 'create-file',
          path: joinFromRoot('shared', 'ui', 'index.ts'),
          content: '',
        },
      ],
      location: { path: joinFromRoot('shared', 'ui') },
    },
  ])
})
