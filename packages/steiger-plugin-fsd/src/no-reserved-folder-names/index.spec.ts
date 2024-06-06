import { expect, it } from 'vitest'

import noReservedFolderNames from './index.js'
import { parseIntoFsdRoot } from '../_lib/prepare-test.js'

it('reports no errors on a project without subfolders in segments that use reserved names', () => {
  const root = parseIntoFsdRoot(`
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
  `)

  expect(noReservedFolderNames.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with subfolders in segments that use reserved names', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.ts
        📂 lib
          📄 someUiFunction.ts
    📂 entities
      📂 user
        📂 ui
        📂 model
        📄 index.ts
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
  `)

  const diagnostics = noReservedFolderNames.check(root).diagnostics
  expect(diagnostics).toEqual([{ message: 'Folder name "lib" in "shared/ui" is reserved for segment names' }])
})
