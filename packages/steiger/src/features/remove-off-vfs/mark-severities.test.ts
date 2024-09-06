import { describe, expect, it } from 'vitest'
import { File, Folder, Severity } from '@steiger/types'

import { copyFsEntity } from '../../shared/file-system'
import markSeverities from './mark-severities'
import { joinFromRoot } from '../../_lib/prepare-test'

const files1: Array<File> = [
  {
    type: 'file',
    path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
  },
  {
    type: 'file',
    path: joinFromRoot('src', 'shared', 'ui', 'Button.tsx'),
  },
  {
    type: 'file',
    path: joinFromRoot('src', 'entities', 'user', 'ui', 'UserAvatar.tsx'),
  },
  {
    type: 'file',
    path: joinFromRoot('src', 'entities', 'user', 'ui', 'index.ts'),
  },
  {
    type: 'file',
    path: joinFromRoot('src', 'entities', 'user', 'index.ts'),
  },
  {
    type: 'file',
    path: joinFromRoot('src', 'entities', 'post', 'index.ts'),
  },
  {
    type: 'file',
    path: joinFromRoot('src', 'entities', 'post', 'ui', 'index.ts'),
  },
  {
    type: 'file',
    path: joinFromRoot('src', 'entities', 'post', 'ui', 'PostList.tsx'),
  },
]

const files2: Array<File | Folder> = [
  {
    type: 'file',
    path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
  },
  {
    type: 'folder',
    path: joinFromRoot('src', 'shared'),
    children: [],
  },
  {
    type: 'folder',
    path: joinFromRoot('src', 'shared', 'ui'),
    children: [],
  },
  {
    type: 'file',
    path: joinFromRoot('src', 'shared', 'ui', 'Button.tsx'),
  },
  {
    type: 'file',
    path: joinFromRoot('src', 'entities', 'user', 'ui', 'UserAvatar.tsx'),
  },
  {
    type: 'file',
    path: joinFromRoot('src', 'entities', 'user', 'ui', 'index.ts'),
  },
  {
    type: 'file',
    path: joinFromRoot('src', 'entities', 'user', 'index.ts'),
  },
  {
    type: 'file',
    path: joinFromRoot('src', 'entities', 'post', 'index.ts'),
  },
  {
    type: 'file',
    path: joinFromRoot('src', 'entities', 'post', 'ui', 'index.ts'),
  },
  {
    type: 'file',
    path: joinFromRoot('src', 'entities', 'post', 'ui', 'PostList.tsx'),
  },
]

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

    const rule1VfsMarked = markSeverities(
      rule1Globs,
      files1.map((f) => copyFsEntity(f)),
    )
    const rule2VfsMarked = markSeverities(
      rule2Globs,
      files1.map((f) => copyFsEntity(f)),
    )

    expect(rule1VfsMarked).toEqual([
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
        severity: 'error',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'user', 'ui', 'index.ts'),
        severity: 'error',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'user', 'index.ts'),
        severity: 'error',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'post', 'index.ts'),
        severity: 'error',
      },
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
    ])

    expect(rule2VfsMarked).toEqual([
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
        severity: 'off',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'user', 'ui', 'index.ts'),
        severity: 'off',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'user', 'index.ts'),
        severity: 'off',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'post', 'index.ts'),
        severity: 'error',
      },
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
    ])
  })

  it('should correctly mark folders', () => {
    const rule1Globs = [
      {
        severity: 'error' as Severity,
        files: [],
        ignores: [],
      },
      {
        severity: 'off' as Severity,
        files: ['**/shared', '**/shared/**'],
        ignores: [],
      },
    ]
    const rule2Globs = [
      {
        severity: 'error' as Severity,
        files: [],
        ignores: [],
      },
    ]

    const rule1VfsMarked = markSeverities(
      rule1Globs,
      files2.map((f) => copyFsEntity(f)),
    )
    const rule2VfsMarked = markSeverities(
      rule2Globs,
      files2.map((f) => copyFsEntity(f)),
    )

    expect(rule1VfsMarked).toEqual([
      {
        type: 'file',
        path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
        severity: 'off',
      },
      {
        type: 'folder',
        path: joinFromRoot('src', 'shared'),
        children: [],
        severity: 'off',
      },
      {
        type: 'folder',
        path: joinFromRoot('src', 'shared', 'ui'),
        children: [],
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
        severity: 'error',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'user', 'ui', 'index.ts'),
        severity: 'error',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'user', 'index.ts'),
        severity: 'error',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'post', 'index.ts'),
        severity: 'error',
      },
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
    ])

    expect(rule2VfsMarked).toEqual([
      {
        type: 'file',
        path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
        severity: 'error',
      },
      {
        type: 'folder',
        path: joinFromRoot('src', 'shared'),
        children: [],
        severity: 'error',
      },
      {
        type: 'folder',
        path: joinFromRoot('src', 'shared', 'ui'),
        children: [],
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
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'user', 'index.ts'),
        severity: 'error',
      },
      {
        type: 'file',
        path: joinFromRoot('src', 'entities', 'post', 'index.ts'),
        severity: 'error',
      },
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
    ])
  })
})
