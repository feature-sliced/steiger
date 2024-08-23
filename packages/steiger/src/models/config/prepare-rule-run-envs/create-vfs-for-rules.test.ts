import { describe, expect, it } from 'vitest'
import createVfsForRules from './create-vfs-for-rules'
import { Folder } from '@steiger/types'
import { parseIntoFsdRoot, joinFromRoot } from '../../../_lib/prepare-test'
import { flattenFolder } from '../../../shared/file-system'

describe('createVfsForRules', () => {
  it('should return an empty object if no rules are provided', () => {
    const vfs: Folder = {
      type: 'folder',
      path: '/src',
      children: [],
    }

    const ruleToVfs = createVfsForRules([], vfs)

    expect(ruleToVfs).toEqual({})
  })

  it('should return an object with a file for each rule', () => {
    const root = parseIntoFsdRoot(
      `
      📂 entities
        📂 user
          📂 ui
          📄 index.ts
        📂 post
          📂 ui
          📄 index.ts
      📂 shared
        📂 ui
          📄 index.ts
          📄 Button.tsx
    `,
      joinFromRoot('src'),
    )

    const ruleToVfs = createVfsForRules(['rule1', 'rule2'], root)
    const files = flattenFolder(root)

    expect(ruleToVfs['rule1']).toEqual(files)
    expect(ruleToVfs['rule2']).toEqual(files)
  })
})
