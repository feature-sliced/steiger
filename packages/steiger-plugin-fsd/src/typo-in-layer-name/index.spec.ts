import { expect, it } from 'vitest'

import typoInLayerName from './index.js'
import { joinFromRoot, parseIntoFsdRoot } from '../_lib/prepare-test.js'

it('reports no errors on a project without typos in layer names', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
    📂 entities
    📂 features
    📂 widgets
    📂 pages
    📂 app
  `)

  expect(typoInLayerName.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with typos in layer names', () => {
  const root = parseIntoFsdRoot(`
    📂 shraed
    📂 entities
    📂 fietures
    📂 wigdets
    📂 page
    📂 app
  `)

  const diagnostics = typoInLayerName.check(root).diagnostics
  expect(diagnostics).toEqual([
    {
      message: 'Layer "shraed" potentially contains a typo. Did you mean "shared"?',
      location: { path: joinFromRoot('shraed') },
    },
    {
      message: 'Layer "fietures" potentially contains a typo. Did you mean "features"?',
      location: { path: joinFromRoot('fietures') },
    },
    {
      message: 'Layer "wigdets" potentially contains a typo. Did you mean "widgets"?',
      location: { path: joinFromRoot('wigdets') },
    },
    {
      message: 'Layer "page" potentially contains a typo. Did you mean "pages"?',
      location: { path: joinFromRoot('page') },
    },
  ])
})
