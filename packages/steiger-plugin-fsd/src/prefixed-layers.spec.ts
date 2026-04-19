import { expect, it } from 'vitest'

import { parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'
import { getLayers } from '@feature-sliced/filesystem'

it('correctly resolves layers with underscore and number prefixes', () => {
  const root = parseIntoFsdRoot(`
    📂 6_shared
      📂 ui
        📄 index.ts
      📂 i18n
        📄 index.ts
    📂 entities
      📂 user
        📂 ui
        📂 model
        📄 index.ts
    📂 _pages
      📂 home
        📂 ui
        📄 index.ts
    📂 pages
      📄 home.tsx
  `)
  const layers = getLayers(root)

  // prefixed layers take precedence over non-prefixed layers
  expect(layers.pages?.path).toEqual('/_pages')

  // layers can be prefixed with a number for ordering
  expect(layers.shared?.path).toEqual('/6_shared')
})
