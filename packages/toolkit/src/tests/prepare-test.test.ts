import { test, expect } from 'vitest'
import { joinFromRoot, parseIntoFolder } from '../prepare-test.js'

test('parseIntoFolder', () => {
  const root = parseIntoFolder(`
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
  const root = parseIntoFolder(markup, joinFromRoot('src'))

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
