import { describe, it, expect } from 'vitest'

import { joinFromRoot, parseIntoFsdRoot } from '../../_lib/prepare-test'
import toPlainVfs from './to-plain-vfs'
import { SeverityMarkedFolder } from './types'

describe('toPlainVfs', () => {
  it('should convert severity-marked VFS to plain VFS', () => {
    const vfs: SeverityMarkedFolder = {
      type: 'folder',
      path: joinFromRoot('src'),
      children: [
        {
          type: 'folder',
          path: joinFromRoot('src', 'shared'),
          children: [
            {
              type: 'folder',
              path: joinFromRoot('src', 'shared', 'ui'),
              children: [
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'Button.ts'),
                  severity: 'warn',
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'Input.ts'),
                  severity: 'error',
                },
              ],
            },
          ],
        },
      ],
    }

    const expected = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 Button.ts
          📄 Input.ts
    `,
      joinFromRoot('src'),
    )

    expect(toPlainVfs(vfs)).toEqual(expected)
  })
})
