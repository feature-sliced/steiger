import { expect, it } from 'vitest'
import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'

import typoInLayerName from './index.js'

it('reports no errors on a project without typos in layer names', () => {
  const root = parseIntoFsdRoot(
    `
    📂 shared
    📂 entities
    📂 features
    📂 widgets
    📂 pages
    📂 app
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect(typoInLayerName.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with typos in layer names', () => {
  const root = parseIntoFsdRoot(
    `
    📂 shraed
    📂 entities
    📂 fietures
    📂 wigdets
    📂 page
    📂 app
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = typoInLayerName.check(root).diagnostics
  expect(diagnostics).toEqual([
    {
      message: 'Layer "page" potentially contains a typo. Did you mean "pages"?',
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'page') },
    },
    {
      message: 'Layer "shraed" potentially contains a typo. Did you mean "shared"?',
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'shraed') },
    },
    {
      message: 'Layer "fietures" potentially contains a typo. Did you mean "features"?',
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'fietures') },
    },
    {
      message: 'Layer "wigdets" potentially contains a typo. Did you mean "widgets"?',
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'wigdets') },
    },
  ])
})

it('reports no errors on a project with custom layers if base layers are present', () => {
  const root = parseIntoFsdRoot(
    `
    📂 shared
    📂 shapes
    📂 entities
    📂 entries
    📂 features
    📂 fixtures
    📂 widgets
    📂 pages
    📂 places
    📂 app
    📂 amp
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  expect(typoInLayerName.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with custom layers if base layers are absent', () => {
  const root = parseIntoFsdRoot(
    `
    📂 shapes
    📂 entries
    📂 fixtures
    📂 places
    📂 amp
  `,
    joinFromRoot('users', 'user', 'project', 'src'),
  )

  const diagnostics = typoInLayerName.check(root).diagnostics
  expect(diagnostics).toEqual([
    {
      message: 'Layer "amp" potentially contains a typo. Did you mean "app"?',
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'amp') },
    },
    {
      message: 'Layer "shapes" potentially contains a typo. Did you mean "shared"?',
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'shapes') },
    },
    {
      message: 'Layer "entries" potentially contains a typo. Did you mean "entities"?',
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'entries') },
    },
    {
      message: 'Layer "fixtures" potentially contains a typo. Did you mean "features"?',
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'fixtures') },
    },
    {
      message: 'Layer "places" potentially contains a typo. Did you mean "pages"?',
      location: { path: joinFromRoot('users', 'user', 'project', 'src', 'places') },
    },
  ])
})
