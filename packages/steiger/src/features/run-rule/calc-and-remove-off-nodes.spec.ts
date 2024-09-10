import calcAndRemoveOffNodes from './calc-and-remove-off-nodes'
import { it, expect, describe } from 'vitest'
import { joinFromRoot, parseIntoFsdRoot } from '../../_lib/prepare-test'
import { GlobGroup } from '../../models/config'

describe('calcAndRemoveOffNodes', () => {
  it("should remove off nodes when there's an off glob group", () => {
    const globs = [
      { severity: 'error', files: [], ignores: [] },
      { severity: 'off', files: ['**/shared', '**/shared/**'], ignores: [] },
    ] as Array<GlobGroup>

    const vfs = parseIntoFsdRoot(
      `
      📂 src
        📂 shared
          📂 ui
            📄 index.ts
        📂 entities
          📂 user
            📄 index.ts
            📂 ui
              📄 UserAvatar.tsx
    `,
      joinFromRoot('src'),
    )

    const expectedVfs = parseIntoFsdRoot(
      `
      📂 src
        📂 entities
          📂 user
            📄 index.ts
            📂 ui
              📄 UserAvatar.tsx
    `,
      joinFromRoot('src'),
    )

    const result = calcAndRemoveOffNodes(globs, vfs)
    expect(result).toEqual(expectedVfs)
  })
})
