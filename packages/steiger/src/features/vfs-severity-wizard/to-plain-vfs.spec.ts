import { describe, it, expect } from 'vitest'

import { joinFromRoot } from '../../_lib/prepare-test'
import toPlainVfs from './to-plain-vfs'
import { SeverityMarkedFolder } from './types'

describe('toPlainVfs', () => {
  it('should convert severity-marked VFS to plain VFS', () => {
    const vfs = {
      type: 'folder',
      path: joinFromRoot('src'),
      severity: 'error',
      children: [
        {
          type: 'folder',
          path: joinFromRoot('src', 'shared'),
          severity: 'error',
          children: [
            {
              type: 'folder',
              path: joinFromRoot('src', 'shared', 'ui'),
              severity: 'error',
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
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
                  severity: 'error',
                },
              ],
            },
            {
              type: 'file',
              path: joinFromRoot('src', 'shared', 'index.ts'),
              severity: 'error',
            },
          ],
        },
      ],
    }

    expect(toPlainVfs(vfs as SeverityMarkedFolder)).toEqual({
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
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'Input.ts'),
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
                },
              ],
            },
            {
              type: 'file',
              path: joinFromRoot('src', 'shared', 'index.ts'),
            },
          ],
        },
      ],
    })
  })
})
