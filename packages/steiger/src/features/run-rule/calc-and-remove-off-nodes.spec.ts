import calcAndRemoveOffNodes from './calc-and-remove-off-nodes'
import { it, expect, describe } from 'vitest'
import { joinFromRoot } from '../../_lib/prepare-test'
import { Folder } from '@steiger/types'
import { GlobGroup } from '../../models/config'

describe('calcAndRemoveOffNodes', () => {
  it("should remove off nodes when there's an off glob group", () => {
    const globs = [
      { severity: 'error', files: [], ignores: [] },
      { severity: 'off', files: ['**/shared', '**/shared/**'], ignores: [] },
    ] as Array<GlobGroup>

    const vfs = {
      type: 'folder',
      path: joinFromRoot('src'),
      children: [
        {
          type: 'folder',
          path: joinFromRoot('src', 'shared'),
          children: [
            {
              type: 'file',
              path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
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
                  type: 'file',
                  path: joinFromRoot('src', 'entities', 'user', 'index.ts'),
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
              ],
            },
          ],
        },
      ],
    } as Folder

    const result = calcAndRemoveOffNodes(globs, vfs)
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
                  type: 'file',
                  path: joinFromRoot('src', 'entities', 'user', 'index.ts'),
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
              ],
            },
          ],
        },
      ],
    })
  })
})
