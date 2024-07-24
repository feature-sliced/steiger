import { join, sep } from 'node:path'
import type { readFileSync, existsSync } from 'node:fs'
import type { FsdRoot } from '@feature-sliced/filesystem'
import type { Folder, File, Diagnostic } from '@steiger/types'
import { vi } from 'vitest'

function findSubfolder(folder: Folder, path: string): Folder {
  function checkFolder(folder: Folder): Folder {
    if (folder.path === path) {
      return folder
    }

    if (path.startsWith(folder.path)) {
      for (const child of folder.children) {
        if (child.type === 'folder') {
          const result = checkFolder(child)
          if (result) {
            return result
          }
        }
      }
    }

    throw new Error(`Path "${path}" not found in the provided file system mock!`)
  }

  return checkFolder(folder)
}

/** Parse a multi-line indented string with emojis for files and folders into an FSD root. */
export function parseIntoFsdRoot(fsMarkup: string, rootPath?: string): FsdRoot {
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
  const parsedFolder = parseFolder(lines, joinFromRoot())

  return rootPath ? findSubfolder(parsedFolder, rootPath) : parsedFolder
}

export function compareMessages(a: Diagnostic, b: Diagnostic): number {
  return a.message.localeCompare(b.message) || a.location.path.localeCompare(b.location.path)
}

export function joinFromRoot(...segments: Array<string>) {
  return join('/', ...segments)
}

export function createFsMocks(mockedFiles: Record<string, string>, original: typeof import('fs')): typeof import('fs') {
  const normalizedMockedFiles = Object.fromEntries(
    Object.entries(mockedFiles).map(([path, content]) => [path.replace(/\//g, sep), content]),
  )

  return {
    ...original,
    readFileSync: vi.fn(((path, options) => {
      const normalizedPath = typeof path === 'string' ? path.replace(/\//g, sep) : path
      if (typeof normalizedPath === 'string' && normalizedPath in normalizedMockedFiles) {
        return normalizedMockedFiles[normalizedPath as keyof typeof normalizedMockedFiles]
      } else {
        return original.readFileSync(normalizedPath, options)
      }
    }) as typeof readFileSync),
    existsSync: vi.fn(((path) => {
      const normalizedPath = typeof path === 'string' ? path.replace(/\//g, sep) : path
      return Object.keys(normalizedMockedFiles).some(
        (key) => key === normalizedPath || key.startsWith(normalizedPath + sep),
      )
    }) as typeof existsSync),
  } as typeof import('fs')
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
      📂 src
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
    const root = parseIntoFsdRoot(markup, joinFromRoot('src', 'entities'))

    expect(root).toEqual({
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
    })
  })

  test('it should throw an error when the path (from rootPath argument) is not found in the provided file system mock', () => {
    const markup = `
      📂 src
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
    expect(() => parseIntoFsdRoot(markup, joinFromRoot('src', 'non-existent-folder'))).toThrowError(
      'Path "/src/non-existent-folder" not found in the provided file system mock!',
    )
  })
}
