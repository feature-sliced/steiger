import { expect, it, describe } from 'vitest'

import removeGlobalIgnoresFromVfs from './remove-global-ignores-from-vfs'
import { joinFromRoot, parseIntoFsdRoot } from '../../_lib/prepare-test'

describe('removeGlobalIgnoresFromVfs', () => {
  it('should remove nodes that match global ignores from VFS', () => {
    const vfs = parseIntoFsdRoot(
      `
      📂 entities
        📂 user
          📂 model
            📂 __mocks__
              📄 store.ts
            📄 store.ts
            📄 store.test.ts
          📂 ui
            📄 UserAvatar.tsx
            📄 UserAvatar.test.tsx
          📄 index.ts 
      `,
      joinFromRoot('src'),
    )
    const expectedVfs = parseIntoFsdRoot(
      `
      📂 entities
        📂 user
          📂 model
            📄 store.ts
          📂 ui
            📄 UserAvatar.tsx
          📄 index.ts 
      `,
      joinFromRoot('src'),
    )

    const globalIgnores = [{ ignores: ['**/__mocks__/**'] }, { ignores: ['**/*.test.{tsx,ts}'] }]

    const result = removeGlobalIgnoresFromVfs(vfs, globalIgnores)

    expect(result).toEqual(expectedVfs)
  })
})
