import { expect, it } from 'vitest'

import repetitiveNaming from './index.js'
import { compareMessages, joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'

it('reports no errors on a project with no repetitive words in slices', async () => {
  const root = parseIntoFsdRoot(`
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
      📂 about
        📂 ui
        📄 index.ts
      📂 contact
        📂 ui
        📄 index.ts
  `)

  expect(await repetitiveNaming.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with repetition of "page"', async () => {
  const root = parseIntoFsdRoot(`
    📂 pages
      📂 homePage
        📂 ui
        📄 index.ts
      📂 aboutPage
        📂 ui
        📄 index.ts
      📂 contactPage
        📂 ui
        📄 index.ts
  `)

  const diagnostics = (await repetitiveNaming.check(root)).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    { message: 'Repetitive word "page" in slice names.', location: { path: joinFromRoot('pages') } },
  ])
})

it('recognizes words in different naming conventions', async () => {
  const root = parseIntoFsdRoot(`
    📂 entities
      📂 ClientFolder
        📂 ui
        📄 index.ts
      📂 provider-folder
        📂 ui
        📄 index.ts
      📂 service_folder
        📂 ui
        📄 index.ts
  `)

  const diagnostics = (await repetitiveNaming.check(root)).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    { message: 'Repetitive word "folder" in slice names.', location: { path: joinFromRoot('entities') } },
  ])
})

it('does not complain about layers with just one slice', async () => {
  const root = parseIntoFsdRoot(`
    📂 pages
      📂 create-post
        📂 ui
          📄 index.tsx
        📄 index.ts
      📂 home
        📂 ui
          📄 index.tsx
        📄 index.ts
      📂 post
        📂 ui
          📄 index.tsx
        📄 index.ts
    📂 features
      📂 create-post
        📂 api
        📂 ui
          📄 index.tsx
        📄 index.ts
    📂 entities
      📂 post
        📂 api
        📂 model
        📂 ui
          📄 index.tsx
        📄 index.ts
  `)

  expect(await repetitiveNaming.check(root)).toEqual({ diagnostics: [] })
})

it('does not treat slice groups as repetitive words', async () => {
  const root = parseIntoFsdRoot(`
    📂 features
      📂 session
        📂 login
          📂 api
          📂 ui
          📄 index.ts
        📂 logout
          📂 api
          📂 ui
          📄 index.ts
        📂 register
          📂 api
          📂 ui
          📄 index.ts
  `)

  expect(await repetitiveNaming.check(root)).toEqual({ diagnostics: [] })
})

it('still recognizes repetitive words inside slice groups', async () => {
  const root = parseIntoFsdRoot(`
    📂 pages
      📂 login-word
        📂 api
        📂 ui
        📄 index.ts
      📂 group
        📂 session
          📂 login-word
            📂 api
            📂 ui
            📄 index.ts
          📂 logout-word
            📂 api
            📂 ui
            📄 index.ts
          📂 register-word
            📂 api
            📂 ui
            📄 index.ts
          📂 word
            📂 api
            📂 ui
            📄 index.ts
  `)

  expect(await repetitiveNaming.check(root)).toEqual({
    diagnostics: [
      {
        location: {
          path: joinFromRoot('pages', 'group', 'session'),
        },
        message: 'Repetitive word "word" in slice names.',
      },
    ],
  })
})
