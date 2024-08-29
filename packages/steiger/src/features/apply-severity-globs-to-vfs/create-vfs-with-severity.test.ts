import { describe, expect, it } from 'vitest'
import { Folder } from '@steiger/types'

import createVfsWithSeverity from './create-vfs-with-severity'
import { SeverityMarkedFile, SeverityMarkedFolder } from './types'
import { joinFromRoot } from '../../_lib/prepare-test'

describe('createVfsWithSeverity', () => {
  it('should create rule run environments', () => {
    const rule1MarkedVfs: Array<SeverityMarkedFile | SeverityMarkedFolder> = [
      {
        type: 'file',
        path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
        severity: 'warn',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'shared', 'ui', 'Button.tsx'),
        severity: 'warn',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'user', 'ui', 'UserAvatar.tsx'),
        severity: 'off',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'user', 'ui', 'index.ts'),
        severity: 'off',
      },
    ]

    const rule2MarkedVfs: Array<SeverityMarkedFile | SeverityMarkedFolder> = [
      {
        type: 'file',
        path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
        severity: 'error',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'shared', 'ui', 'Button.tsx'),
        severity: 'error',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'user', 'ui', 'UserAvatar.tsx'),
        severity: 'error',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'user', 'ui', 'index.ts'),
        severity: 'error',
      },
    ]

    const root: Folder = {
      type: 'folder',
      path: joinFromRoot('src'),
      children: [],
    }

    const rule1Vfs = createVfsWithSeverity(rule1MarkedVfs, root)

    expect(rule1Vfs).toEqual({
      severityMap: {
        [joinFromRoot('src', 'shared', 'ui', 'index.ts')]: 'warn',
        [joinFromRoot('src', 'shared', 'ui', 'Button.tsx')]: 'warn',
        [joinFromRoot('src', 'entities', 'user', 'ui', 'UserAvatar.tsx')]: 'off',
        [joinFromRoot('src', 'entities', 'user', 'ui', 'index.ts')]: 'off',
      },
      vfs: {
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
                    path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
                  },
                  {
                    type: 'file',
                    path: joinFromRoot('src', 'shared', 'ui', 'Button.tsx'),
                  },
                ],
              },
            ],
          },
        ],
      },
    })

    const rule2Vfs = createVfsWithSeverity(rule2MarkedVfs, root)

    expect(rule2Vfs).toEqual({
      severityMap: {
        [joinFromRoot('src', 'shared', 'ui', 'index.ts')]: 'error',
        [joinFromRoot('src', 'shared', 'ui', 'Button.tsx')]: 'error',
        [joinFromRoot('src', 'entities', 'user', 'ui', 'UserAvatar.tsx')]: 'error',
        [joinFromRoot('src', 'entities', 'user', 'ui', 'index.ts')]: 'error',
      },
      vfs: {
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
                    path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
                  },
                  {
                    type: 'file',
                    path: joinFromRoot('src', 'shared', 'ui', 'Button.tsx'),
                  },
                ],
              },
            ],
          },
          {
            type: 'folder',
            path: joinFromRoot('src', 'entities'),
            children: [
              {
                type: 'folder',
                path: joinFromRoot('src', 'entities', 'user'),
                children: [
                  {
                    type: 'folder',
                    path: joinFromRoot('src', 'entities', 'user', 'ui'),
                    children: [
                      {
                        type: 'file',
                        path: joinFromRoot('src', 'entities', 'user', 'ui', 'UserAvatar.tsx'),
                      },
                      {
                        type: 'file',
                        path: joinFromRoot('src', 'entities', 'user', 'ui', 'index.ts'),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    })
  })

  it('should return null for vfs that has all files off', () => {
    const ruleToMarkedVfs: Array<SeverityMarkedFile | SeverityMarkedFolder> = [
      {
        type: 'file',
        path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
        severity: 'off',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'shared', 'ui', 'Button.tsx'),
        severity: 'off',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'user', 'ui', 'UserAvatar.tsx'),
        severity: 'off',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'user', 'ui', 'index.ts'),
        severity: 'off',
      },
    ]

    const root: Folder = {
      type: 'folder',
      path: joinFromRoot('src'),
      children: [],
    }

    const vfsWithSeverity = createVfsWithSeverity(ruleToMarkedVfs, root)

    expect(vfsWithSeverity).toEqual({
      severityMap: {
        [joinFromRoot('src', 'shared', 'ui', 'index.ts')]: 'off',
        [joinFromRoot('src', 'shared', 'ui', 'Button.tsx')]: 'off',
        [joinFromRoot('src', 'entities', 'user', 'ui', 'UserAvatar.tsx')]: 'off',
        [joinFromRoot('src', 'entities', 'user', 'ui', 'index.ts')]: 'off',
      },
      vfs: null,
    })
  })
})
