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

  const fileRemoved = createEvent<string>()
  $tree.on(fileRemoved, (state, removedFilePath) =>
    produce(state, (draft) => {
      const pathSegments = relative(rootPath, removedFilePath).split(sep)
      const parents = [draft]
      let currentFolder = draft

      for (const pathSegment of pathSegments.slice(0, -1)) {
        const existingChild = currentFolder.children.find(
          (child) => child.type === 'folder' && basename(child.path) === pathSegment,
        ) as Folder | undefined

        if (existingChild === undefined) {
          throw Error(`Folder ${pathSegment} not found`)
        } else {
          currentFolder = existingChild
          parents.push(currentFolder)
        }
      }

      const removedFileIndex = currentFolder.children.findIndex(
        (child) => child.type === 'file' && child.path === removedFilePath,
      )

      if (removedFileIndex === -1) {
        throw Error(`File ${removedFilePath} not found`)
      }

      currentFolder.children.splice(removedFileIndex, 1)
      parents.reverse().forEach((parent, index) => {
        if (parent.children.length === 0 && parents[index + 1] !== undefined) {
          parents[index + 1].children.splice(parents[index + 1].children.indexOf(parent), 1)
        }
      })
    }),
  )

  return { $tree, fileAdded, fileRemoved }
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest
  describe('createVfsRoot', () => {
    it('allows adding files and creates folders automatically', () => {
      const { $tree, fileAdded } = createVfsRoot(join('/', 'project', 'src'))

      expect($tree.getState()).toEqual({ type: 'folder', path: join('/', 'project', 'src'), children: [] })

      fileAdded(join('/', 'project', 'src', 'index.ts'))
      fileAdded(join('/', 'project', 'src', 'components', 'button.ts'))
      fileAdded(join('/', 'project', 'src', 'components', 'input.ts'))
      fileAdded(join('/', 'project', 'src', 'components', 'input', 'styles.ts'))

      expect($tree.getState()).toEqual({
        type: 'folder',
        path: join('/', 'project', 'src'),
        children: [
          {
            type: 'file',
            path: join('/', 'project', 'src', 'index.ts'),
          },
          {
            type: 'folder',
            path: join('/', 'project', 'src', 'components'),
            children: [
              {
                type: 'file',
                path: join('/', 'project', 'src', 'components', 'button.ts'),
              },
              {
                type: 'file',
                path: join('/', 'project', 'src', 'components', 'input.ts'),
              },

              {
                type: 'folder',
                path: join('/', 'project', 'src', 'components', 'input'),
                children: [
                  {
                    type: 'file',
                    path: join('/', 'project', 'src', 'components', 'input', 'styles.ts'),
                  },
                ],
              },
            ],
          },
        ],
      })
    })

    it('allows removing files and deletes empty folders automatically', () => {
      const { $tree, fileAdded, fileRemoved } = createVfsRoot(join('/', 'project', 'src'))

      fileAdded(join('/', 'project', 'src', 'index.ts'))
      fileAdded(join('/', 'project', 'src', 'components', 'input', 'styles.ts'))

      expect($tree.getState()).toEqual({
        type: 'folder',
        path: join('/', 'project', 'src'),
        children: [
          {
            type: 'file',
            path: join('/', 'project', 'src', 'index.ts'),
          },
          {
            type: 'folder',
            path: join('/', 'project', 'src', 'components'),
            children: [
              {
                type: 'folder',
                path: join('/', 'project', 'src', 'components', 'input'),
                children: [
                  {
                    type: 'file',
                    path: join('/', 'project', 'src', 'components', 'input', 'styles.ts'),
                  },
                ],
              },
            ],
          },
        ],
      })

      fileRemoved(join('/', 'project', 'src', 'components', 'input', 'styles.ts'))

      expect($tree.getState()).toEqual({
        type: 'folder',
        path: join('/', 'project', 'src'),
        children: [
          {
            type: 'file',
            path: join('/', 'project', 'src', 'index.ts'),
          },
        ],
      })

      fileRemoved(join('/', 'project', 'src', 'index.ts'))

      expect($tree.getState()).toEqual({ type: 'folder', path: join('/', 'project', 'src'), children: [] })
    })

    it('allows tracking two separate roots independently', () => {
      const root1 = createVfsRoot(join('/', 'project1', 'src'))
      const root2 = createVfsRoot(join('/', 'project2', 'src'))

      root1.fileAdded(join('/', 'project1', 'src', 'index.ts'))

      expect(root1.$tree.getState()).toEqual({
        type: 'folder',
        path: join('/', 'project1', 'src'),
        children: [
          {
            type: 'file',
            path: join('/', 'project1', 'src', 'index.ts'),
          },
        ],
      })
      expect(root2.$tree.getState()).toEqual({
        type: 'folder',
        path: join('/', 'project2', 'src'),
        children: [],
      })

      root2.fileAdded(join('/', 'project2', 'src', 'shared', 'ui', 'button.ts'))

      expect(root2.$tree.getState()).toEqual({
        type: 'folder',
        path: join('/', 'project2', 'src'),
        children: [
          {
            type: 'folder',
            path: join('/', 'project2', 'src', 'shared'),
            children: [
              {
                type: 'folder',
                path: join('/', 'project2', 'src', 'shared', 'ui'),
                children: [
                  {
                    type: 'file',
                    path: join('/', 'project2', 'src', 'shared', 'ui', 'button.ts'),
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
