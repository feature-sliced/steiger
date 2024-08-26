import { describe, expect, it } from 'vitest'
import { File } from '@steiger/types'

import { copyFsEntity } from '../../../shared/file-system'
import markSeverities from './mark-severities'
import { RuleInstructions } from '../types'
import { joinFromRoot } from '../../../_lib/prepare-test'

describe('markSeverities', () => {
  it('should mark FS entities', () => {
    const files: Array<File> = [
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

    const ruleToVfs: Record<string, Array<File>> = {
      rule1: files.map((f) => copyFsEntity(f)),
      rule2: files.map((f) => copyFsEntity(f)),
    }

    const ruleToInstructions: Record<string, RuleInstructions> = {
      rule1: {
        options: {},
        globGroups: [
          {
            severity: 'error',
            files: [],
            ignores: [],
          },
          {
            severity: 'warn',
            files: ['/src/shared/**'],
            ignores: [],
          },
        ],
      },
      rule2: {
        options: {},
        globGroups: [
          {
            severity: 'error',
            files: [],
            ignores: [],
          },
          {
            severity: 'off',
            files: ['/src/entities/user/**'],
            ignores: [],
          },
        ],
      },
    }

    const marked = markSeverities(ruleToInstructions, ruleToVfs)
    expect(marked).toEqual({
      rule1: [
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
      ],

      rule2: [
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
      ],
    })
  })
})
