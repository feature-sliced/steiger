import { join } from 'node:path'
import type { FsdRoot } from '@feature-sliced/filesystem'
import type { Folder, File, PartialDiagnostic } from '@steiger/types'

/** Parse a multi-line indented string with emojis for files and folders into an FSD root.
 * @param fsMarkup - a file system tree represented in markup using file and folder emojis
 * @param mountTo - virtually make the passed markup a subtree of the mountTo folder
 * */
export function parseIntoFsdRoot(fsMarkup: string, mountTo?: string): FsdRoot {
  function parseFolder(lines: Array<string>, path: string): Folder {
    const children: Array<Folder | File> = []

    lines.forEach((line, index) => {
      if (line.startsWith('📂 ')) {
        let nestedLines = lines.slice(index + 1)
        const nextIndex = nestedLines.findIndex((line) => !line.startsWith('  '))
        nestedLines = nestedLines.slice(0, nextIndex === -1 ? nestedLines.length : nextIndex)
        const folder = parseFolder(
          nestedLines.map((line) => line.slice('  '.length)),
          join(path, line.slice('📂 '.length)),
        )
        children.push(folder)
      } else if (line.startsWith('📄 ')) {
        children.push({ type: 'file', path: join(path, line.slice('📄 '.length)) })
      }
    })

    return { type: 'folder', path, children }
  }

  const lines = fsMarkup
    .split('\n')
    .filter(Boolean)
    .map((line, _i, lines) => line.slice(lines[0].search(/\S/)))
    .filter(Boolean)

  return parseFolder(lines, mountTo ?? joinFromRoot())
}

export function compareMessages(a: PartialDiagnostic, b: PartialDiagnostic): number {
  return a.message.localeCompare(b.message) || a.location.path.localeCompare(b.location.path)
}

export function joinFromRoot(...segments: Array<string>) {
  return join('/', ...segments)
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest

  test('parseIntoFsdRoot', () => {
    const root = parseIntoFsdRoot(`
      📂 entities
        📂 users
          📂 ui
          📄 index.ts
        📂 posts
          📂 ui
          📄 index.ts
      📂 shared
        📂 ui
          📄 index.ts
          📄 Button.tsx
    `)

    expect(root).toEqual({
      type: 'folder',
      path: joinFromRoot(),
      children: [
        {
          type: 'folder',
          path: joinFromRoot('entities'),
          children: [
            {
              type: 'folder',
              path: joinFromRoot('entities', 'users'),
              children: [
                {
                  type: 'folder',
                  path: joinFromRoot('entities', 'users', 'ui'),
                  children: [],
                },
                {
                  type: 'file',
                  path: joinFromRoot('entities', 'users', 'index.ts'),
                },
              ],
            },
            {
              type: 'folder',
              path: joinFromRoot('entities', 'posts'),
              children: [
                {
                  type: 'folder',
                  path: joinFromRoot('entities', 'posts', 'ui'),
                  children: [],
                },
                {
                  type: 'file',
                  path: joinFromRoot('entities', 'posts', 'index.ts'),
                },
              ],
            },
          ],
        },
        {
          type: 'folder',
          path: joinFromRoot('shared'),
          children: [
            {
              type: 'folder',
              path: joinFromRoot('shared', 'ui'),
              children: [
                {
                  type: 'file',
                  path: joinFromRoot('shared', 'ui', 'index.ts'),
                },
                {
                  type: 'file',
                  path: joinFromRoot('shared', 'ui', 'Button.tsx'),
                },
              ],
            },
          ],
        },
      ],
    })
  })

  test('it should return a nested root folder when the optional rootPath argument is passed', () => {
    const markup = `
      📂 entities
        📂 users
          📂 ui
          📄 index.ts
        📂 posts
          📂 ui
          📄 index.ts
      📂 shared
        📂 ui
          📄 index.ts
          📄 Button.tsx
    `
    const root = parseIntoFsdRoot(markup, joinFromRoot('src'))

    expect(root).toEqual({
      type: 'folder',
      path: joinFromRoot('src'),
      children: [
        {
          type: 'folder',
          path: joinFromRoot('src', 'entities'),
          children: [
            {
              type: 'folder',
              path: joinFromRoot('src', 'entities', 'users'),
              children: [
                {
                  type: 'folder',
                  path: joinFromRoot('src', 'entities', 'users', 'ui'),
                  children: [],
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'entities', 'users', 'index.ts'),
                },
              ],
            },
            {
              type: 'folder',
              path: joinFromRoot('src', 'entities', 'posts'),
              children: [
                {
                  type: 'folder',
                  path: joinFromRoot('src', 'entities', 'posts', 'ui'),
                  children: [],
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'entities', 'posts', 'index.ts'),
                },
              ],
            },
          ],
        },
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
    })
  })
}
