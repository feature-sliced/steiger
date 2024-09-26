import { describe, it, expect } from 'vitest'

import { joinFromRoot } from '../../_lib/prepare-test'
import calculateFolderSeverity from './calculate-folder-severity'
import { SeverityMarkedFolder } from './types'

describe('propagateSeverityToFolders', () => {
  it('should propagate severity to folders', () => {
    const vfs = {
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
                  path: joinFromRoot('src', 'shared', 'ui', 'Button.tsx'),
                  severity: 'off',
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'Input.tsx'),
                  severity: 'off',
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
                  severity: 'warn',
                },
              ],
            },
            {
              type: 'folder',
              path: joinFromRoot('src', 'shared', 'lib'),
              children: [
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'lib', 'device-detect.ts'),
                  severity: 'warn',
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'lib', 'get-query-params.ts'),
                  severity: 'warn',
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'lib', 'index.ts'),
                  severity: 'error',
                },
              ],
            },
          ],
        },
      ],
    }

    const result = calculateFolderSeverity(vfs as SeverityMarkedFolder)

    expect(result).toEqual('error')
  })
})
