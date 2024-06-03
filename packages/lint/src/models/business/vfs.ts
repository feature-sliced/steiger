import { basename, sep, join, relative } from 'node:path'
import type { Folder } from '@feature-sliced/filesystem'
import { createEvent, createStore } from 'effector'
import { produce } from 'immer'

export function createVfsRoot(rootPath: string) {
  const rootFolder: Folder = { type: 'folder', path: rootPath, children: [] }
  const $tree = createStore(rootFolder)

  const fileAdded = createEvent<string>()
  $tree.on(fileAdded, (state, newFilePath) =>
    produce(state, (draft) => {
      const pathSegments = relative(rootPath, newFilePath).split(sep)
      let currentFolder = draft

      for (const pathSegment of pathSegments.slice(0, -1)) {
        const existingChild = currentFolder.children.find(
          (child) => child.type === 'folder' && basename(child.path) === pathSegment,
        ) as Folder | undefined

        if (existingChild === undefined) {
          currentFolder.children.push({
            type: 'folder',
            path: join(currentFolder.path, pathSegment),
            children: [],
          })
          currentFolder = currentFolder.children[currentFolder.children.length - 1] as Folder
        } else {
          currentFolder = existingChild
        }
      }

      currentFolder.children.push({ type: 'file', path: newFilePath })
    }),
  )

  return { $tree, fileAdded }
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest
  describe('createVfsRoot', () => {
    it('allows adding files and creates folders automatically', () => {
      const { $tree, fileAdded } = createVfsRoot('/project/src')

      expect($tree.getState()).toEqual({ type: 'folder', path: '/project/src', children: [] })

      fileAdded('/project/src/index.ts')
      fileAdded('/project/src/components/button.ts')
      fileAdded('/project/src/components/input.ts')
      fileAdded('/project/src/components/input/styles.ts')

      expect($tree.getState()).toEqual({
        type: 'folder',
        path: '/project/src',
        children: [
          {
            type: 'file',
            path: '/project/src/index.ts',
          },
          {
            type: 'folder',
            path: '/project/src/components',
            children: [
              {
                type: 'file',
                path: '/project/src/components/button.ts',
              },
              {
                type: 'file',
                path: '/project/src/components/input.ts',
              },

              {
                type: 'folder',
                path: '/project/src/components/input',
                children: [
                  {
                    type: 'file',
                    path: '/project/src/components/input/styles.ts',
                  },
                ],
              },
            ],
          },
        ],
      })
    })

    it('allows tracking two separate roots independently', () => {
      const root1 = createVfsRoot('/project1/src')
      const root2 = createVfsRoot('/project2/src')

      root1.fileAdded('/project1/src/index.ts')

      expect(root1.$tree.getState()).toEqual({
        type: 'folder',
        path: '/project1/src',
        children: [
          {
            type: 'file',
            path: '/project1/src/index.ts',
          },
        ],
      })
      expect(root2.$tree.getState()).toEqual({
        type: 'folder',
        path: '/project2/src',
        children: [],
      })

      root2.fileAdded('/project2/src/shared/ui/button.ts')

      expect(root2.$tree.getState()).toEqual({
        type: 'folder',
        path: '/project2/src',
        children: [
          {
            type: 'folder',
            path: '/project2/src/shared',
            children: [
              {
                type: 'folder',
                path: '/project2/src/shared/ui',
                children: [
                  {
                    type: 'file',
                    path: '/project2/src/shared/ui/button.ts',
                  },
                ],
              },
            ],
          },
        ],
      })
    })
  })
}
