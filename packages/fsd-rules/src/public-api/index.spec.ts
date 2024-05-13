import { expect, it } from 'vitest'

import { compareMessages, parseIntoFsdRoot } from '../_lib/prepare-test'
import publicApi from '.'

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

  expect(publicApi.check(root, { isTypeScript: true })).toEqual({ diagnostics: [] })
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

  const diagnostics = publicApi.check(root, { isTypeScript: true }).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    {
      message: 'On the "entities" layer, slice "posts" is missing a public API.',
      fixes: [
        {
          type: 'create-file',
          path: 'entities/posts/index.ts',
          content: '',
        },
      ],
    },
    {
      message: 'On the "pages" layer, slice "editor" is missing a public API.',
      fixes: [
        {
          type: 'create-file',
          path: 'pages/editor/index.ts',
          content: '',
        },
      ],
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

  const diagnostics = publicApi.check(root, { isTypeScript: true }).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    {
      message: 'On the "app" layer, segment "providers" is missing a public API.',
      fixes: [
        {
          type: 'create-file',
          path: 'app/providers/index.ts',
          content: '',
        },
      ],
    },
    {
      message: 'On the "app" layer, segment "styles" is missing a public API.',
      fixes: [
        {
          type: 'create-file',
          path: 'app/styles/index.ts',
          content: '',
        },
      ],
    },
    {
      message: 'On the "shared" layer, segment "ui" is missing a public API.',
      fixes: [
        {
          type: 'create-file',
          path: 'shared/ui/index.ts',
          content: '',
        },
      ],
    },
  ])
})
