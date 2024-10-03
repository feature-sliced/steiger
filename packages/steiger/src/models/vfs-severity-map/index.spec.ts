import { describe, it, expect } from 'vitest'
import { Folder } from '@steiger/types'

import { joinFromRoot } from '../../_lib/prepare-test'
import { calculateSeveritiesForPaths, getVfsWithoutOffNodes } from './index'
import { GlobGroupWithSeverity } from '../config'

describe('vfs-severity-wizard', () => {
  it('should return vfs without off severity', () => {
    const globGroups: Array<GlobGroupWithSeverity> = [
      { files: [], ignores: [], severity: 'error' },
      {
        files: ['**/device-detect.ts', '**/Button.tsx'],
        ignores: [],
        severity: 'off',
      },
    ]
    const vfs: Folder = {
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
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'Input.tsx'),
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
                },
              ],
            },
          ],
        },
      ],
    }

    const expectedVfs = {
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
                  path: joinFromRoot('src', 'shared', 'ui', 'Input.tsx'),
                },
              ],
            },
          ],
        },
      ],
    }

    expect(getVfsWithoutOffNodes(vfs, globGroups)).toEqual(expectedVfs)
  })

  it('should find severities for the passed paths', () => {
    const globGroups: Array<GlobGroupWithSeverity> = [
      { files: [], ignores: [], severity: 'error' },
      {
        files: ['**/device-detect.ts', '**/Button.tsx'],
        ignores: [],
        severity: 'off',
      },
      {
        files: ['/src/shared/lib/get-query-string.ts'],
        ignores: [],
        severity: 'warn',
      },
    ]
    const vfs: Folder = {
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
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'Input.tsx'),
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
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'lib', 'get-query-string.ts'),
                },
              ],
            },
          ],
        },
      ],
    }

    const actual = calculateSeveritiesForPaths(vfs, globGroups, [
      joinFromRoot('src', 'shared', 'lib', 'get-query-string.ts'),
      joinFromRoot('src', 'shared', 'ui', 'Button.ts'),
      joinFromRoot('src', 'shared', 'ui', 'Input.tsx'),
      joinFromRoot('src', 'shared', 'ui'),
      joinFromRoot('src', 'shared'),
    ])

    expect(actual).toEqual(['warn', null, 'error', 'error', 'error'])
  })
})
