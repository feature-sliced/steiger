import { describe, it, expect } from 'vitest'

import { joinFromRoot } from '../../_lib/prepare-test'
import propagateSeverityToFolders from './propagate-severity-to-folders'
import { SeverityMarkedFolder } from './types'

describe('propagateSeverityToFolders', () => {
  it('should propagate severity to folders', () => {
    const vfs = {
      type: 'folder',
      path: joinFromRoot('src'),
      severity: 'off',
      children: [
        {
          type: 'folder',
          path: joinFromRoot('src', 'shared'),
          severity: 'off',
          children: [
            {
              type: 'folder',
              path: joinFromRoot('src', 'shared', 'ui'),
              severity: 'warn',
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
              severity: 'off',
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

    const result = propagateSeverityToFolders(vfs as SeverityMarkedFolder)

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
              severity: 'warn',
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
              severity: 'error',
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
    })
  })

  it('should correctly propagate severity when countChildFolders is false', () => {
    const vfs = {
      type: 'folder',
      path: joinFromRoot('src'),
      severity: 'off',
      children: [
        {
          type: 'folder',
          path: joinFromRoot('src', 'shared'),
          severity: 'off',
          children: [
            {
              type: 'folder',
              path: joinFromRoot('src', 'shared', 'ui'),
              severity: 'off',
              children: [
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'Button.tsx'),
                  severity: 'error',
                },
              ],
            },
          ],
        },
      ],
    }

    const result = propagateSeverityToFolders(vfs as SeverityMarkedFolder, false)

    expect(result).toEqual({
      type: 'folder',
      path: joinFromRoot('src'),
      severity: 'off',
      children: [
        {
          type: 'folder',
          path: joinFromRoot('src', 'shared'),
          severity: 'off',
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
              ],
            },
          ],
        },
      ],
    })
  })
})
