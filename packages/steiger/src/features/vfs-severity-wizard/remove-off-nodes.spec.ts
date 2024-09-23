import removeOffNodes from './remove-off-nodes'
import { describe, expect, it } from 'vitest'
import { joinFromRoot } from '../../_lib/prepare-test'
import { SeverityMarkedFolder } from './types'

describe('removeOffNodes', () => {
  it('should remove off nodes', () => {
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
                  path: joinFromRoot('src', 'shared', 'ui', 'Button.tsx'),
                  severity: 'error',
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'Button.test.tsx'),
                  severity: 'off',
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
                  severity: 'error',
                },
              ],
            },
            {
              type: 'folder',
              path: joinFromRoot('src', 'shared', 'lib'),
              severity: 'off',
              children: [
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'lib', 'device-detect.ts'),
                  severity: 'off',
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'lib', 'get-query-params.ts'),
                  severity: 'off',
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'lib', 'index.ts'),
                  severity: 'off',
                },
              ],
            },
          ],
        },
      ],
    }

    const result = removeOffNodes(vfs as SeverityMarkedFolder)

    expect(result).toEqual({
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
                  path: joinFromRoot('src', 'shared', 'ui', 'Button.tsx'),
                  severity: 'error',
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
                  severity: 'error',
                },
              ],
            },
          ],
        },
      ],
    })
  })
})
