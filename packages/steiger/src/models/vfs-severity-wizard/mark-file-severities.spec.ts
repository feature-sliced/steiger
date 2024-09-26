import { describe, expect, it } from 'vitest'
import { Severity } from '@steiger/types'

import markFileSeverities from './mark-file-severities'
import { joinFromRoot, parseIntoFsdRoot } from '../../_lib/prepare-test'

const files1 = parseIntoFsdRoot(
  `
  📂 shared
    📂 ui
      📄 index.ts
      📄 Button.tsx
  📂 entities
    📂 user
      📂 ui
        📄 UserAvatar.tsx
        📄 index.ts
      📄 index.ts
    📂 post
      📄 index.ts
      📂 ui
        📄 index.ts
        📄 PostList.tsx
`,
  joinFromRoot('src'),
)

const files2 = parseIntoFsdRoot(
  `
  📂 shared
    📂 ui
      📄 index.ts
      📄 Button.tsx
  📂 entities
    📂 user
      📂 ui
        📄 UserAvatar.tsx
        📄 index.ts
      📄 index.ts
    📂 post
      📄 index.ts
      📂 ui
        📄 index.ts
        📄 PostList.tsx
`,
  joinFromRoot('src'),
)

describe('markSeverities', () => {
  it('should mark FS entities', () => {
    const rule1Globs = [
      {
        severity: 'error' as Severity,
        files: [],
        ignores: [],
      },
      {
        severity: 'warn' as Severity,
        files: ['/src/shared/**'],
        ignores: [],
      },
    ]

    const rule2Globs = [
      {
        severity: 'error' as Severity,
        files: [],
        ignores: [],
      },
      {
        severity: 'off' as Severity,
        files: ['/src/entities/user/**'],
        ignores: [],
      },
    ]

    const rule1VfsMarked = markFileSeverities(rule1Globs, files1)
    const rule2VfsMarked = markFileSeverities(rule2Globs, files1)

    expect(rule1VfsMarked).toEqual({
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
                  severity: 'warn',
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'Button.tsx'),
                  severity: 'warn',
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
                      severity: 'error',
                    },
                    {
                      type: 'file',
                      path: joinFromRoot('src', 'entities', 'user', 'ui', 'index.ts'),
                      severity: 'error',
                    },
                  ],
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'entities', 'user', 'index.ts'),
                  severity: 'error',
                },
              ],
            },
            {
              type: 'folder',
              path: joinFromRoot('src', 'entities', 'post'),
              children: [
                {
                  type: 'file',
                  path: joinFromRoot('src', 'entities', 'post', 'index.ts'),
                  severity: 'error',
                },
                {
                  type: 'folder',
                  path: joinFromRoot('src', 'entities', 'post', 'ui'),
                  children: [
                    {
                      type: 'file',
                      path: joinFromRoot('src', 'entities', 'post', 'ui', 'index.ts'),
                      severity: 'error',
                    },
                    {
                      type: 'file',
                      path: joinFromRoot('src', 'entities', 'post', 'ui', 'PostList.tsx'),
                      severity: 'error',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })

    expect(rule2VfsMarked).toEqual({
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
                  severity: 'error',
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'Button.tsx'),
                  severity: 'error',
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
                      severity: 'off',
                    },
                    {
                      type: 'file',
                      path: joinFromRoot('src', 'entities', 'user', 'ui', 'index.ts'),
                      severity: 'off',
                    },
                  ],
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'entities', 'user', 'index.ts'),
                  severity: 'off',
                },
              ],
            },
            {
              type: 'folder',
              path: joinFromRoot('src', 'entities', 'post'),
              children: [
                {
                  type: 'file',
                  path: joinFromRoot('src', 'entities', 'post', 'index.ts'),
                  severity: 'error',
                },
                {
                  type: 'folder',
                  path: joinFromRoot('src', 'entities', 'post', 'ui'),
                  children: [
                    {
                      type: 'file',
                      path: joinFromRoot('src', 'entities', 'post', 'ui', 'index.ts'),
                      severity: 'error',
                    },
                    {
                      type: 'file',
                      path: joinFromRoot('src', 'entities', 'post', 'ui', 'PostList.tsx'),
                      severity: 'error',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
  })

  it('should correctly with folder contents glob', () => {
    const rule1Globs = [
      {
        severity: 'error' as Severity,
        files: [],
        ignores: [],
      },
      {
        severity: 'off' as Severity,
        files: ['**/entities/user/*', '**/entities/post/*'],
        ignores: [],
      },
    ]
    const rule1VfsMarked = markFileSeverities(rule1Globs, files2)

    expect(rule1VfsMarked).toEqual({
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
                  severity: 'error',
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'Button.tsx'),
                  severity: 'error',
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
                      severity: 'error',
                    },
                    {
                      type: 'file',
                      path: joinFromRoot('src', 'entities', 'user', 'ui', 'index.ts'),
                      severity: 'error',
                    },
                  ],
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'entities', 'user', 'index.ts'),
                  severity: 'off',
                },
              ],
            },
            {
              type: 'folder',
              path: joinFromRoot('src', 'entities', 'post'),
              children: [
                {
                  type: 'file',
                  path: joinFromRoot('src', 'entities', 'post', 'index.ts'),
                  severity: 'off',
                },
                {
                  type: 'folder',
                  path: joinFromRoot('src', 'entities', 'post', 'ui'),
                  children: [
                    {
                      type: 'file',
                      path: joinFromRoot('src', 'entities', 'post', 'ui', 'index.ts'),
                      severity: 'error',
                    },
                    {
                      type: 'file',
                      path: joinFromRoot('src', 'entities', 'post', 'ui', 'PostList.tsx'),
                      severity: 'error',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
  })
})
