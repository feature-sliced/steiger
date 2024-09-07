import { expect, it, describe } from 'vitest'
import { Folder } from '@steiger/types'

import removeGlobalIgnoresFromVfs from './index'
import { joinFromRoot } from '../../_lib/prepare-test'

describe('removeGlobalIgnoresFromVfs', () => {
  it('should remove nodes that match global ignores from VFS', () => {
    const vfs = {
      type: 'folder',
      path: joinFromRoot('src'),
      children: [
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
                  path: joinFromRoot('src', 'entities', 'user', 'model'),
                  children: [
                    {
                      type: 'folder',
                      path: joinFromRoot('src', 'entities', 'user', 'model', '__mocks__'),
                      children: [
                        {
                          type: 'file',
                          path: joinFromRoot('src', 'entities', 'user', 'model', '__mocks__', 'store.ts'),
                        },
                      ],
                    },
                    {
                      type: 'file',
                      path: joinFromRoot('src', 'entities', 'user', 'model', 'store.ts'),
                    },
                    {
                      type: 'file',
                      path: joinFromRoot('src', 'entities', 'user', 'model', 'store.test.ts'),
                    },
                  ],
                },
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
                      path: joinFromRoot('src', 'entities', 'user', 'ui', 'UserAvatar.test.tsx'),
                    },
                  ],
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'entities', 'user', 'index.ts'),
                },
              ],
            },
          ],
        },
      ],
    } as Folder

    const globalIgnores = [{ ignores: ['**/__mocks__', '**/__mocks__/**'] }, { ignores: ['**/*.test.{tsx,ts}'] }]

    const result = removeGlobalIgnoresFromVfs(vfs, globalIgnores)

    expect(result).toEqual({
      type: 'folder',
      path: joinFromRoot('src'),
      children: [
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
                  path: joinFromRoot('src', 'entities', 'user', 'model'),
                  children: [
                    {
                      type: 'file',
                      path: joinFromRoot('src', 'entities', 'user', 'model', 'store.ts'),
                    },
                  ],
                },
                {
                  type: 'folder',
                  path: joinFromRoot('src', 'entities', 'user', 'ui'),
                  children: [
                    {
                      type: 'file',
                      path: joinFromRoot('src', 'entities', 'user', 'ui', 'UserAvatar.tsx'),
                    },
                  ],
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'entities', 'user', 'index.ts'),
                },
              ],
            },
          ],
        },
      ],
    })
  })
})
