import { expect, it } from 'vitest'

import repetitiveNaming from '.'
import { parseIntoFsdRoot } from '../prepare-test'

it('reports no errors on a project with no repetitive words in slices', () => {
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

  expect(repetitiveNaming.check(root)).toEqual({ errors: [] })
})

it('reports errors on a project with repetition of "page"', () => {
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

  const errors = repetitiveNaming.check(root).errors.sort()
  expect(errors).toEqual([
    'Repetitive word "page" in slice names on layer "pages"',
  ])
})

it('recognizes words in different naming conventions', () => {
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

  const errors = repetitiveNaming.check(root).errors.sort()
  expect(errors).toEqual([
    'Repetitive word "folder" in slice names on layer "entities"',
  ])
})
