import { expect, it, vi } from 'vitest'
import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'

import fsd, { createFsdPlugin } from './index.js'

vi.mock('tsconfck', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('tsconfck')>()),
    parse: vi.fn(() =>
      Promise.resolve({
        tsconfig: {
          compilerOptions: {
            baseUrl: '/src/',
            paths: {
              '@/*': ['./*'],
            },
          },
        },
      }),
    ),
  }
})

vi.mock('node:fs', async (importOriginal) => {
  const originalFs = await importOriginal<typeof import('fs')>()
  const { createFsMocks } = await import('@steiger/toolkit/test')

  return createFsMocks(
    {
      '/src/features/comments/ui/CommentCard.tsx': 'import { styles } from "@/screens/editor"',
      '/src/features/comments/index.ts': '',
      '/src/entities/export-encoding/model/index.ts': '',
      '/src/entities/export-encoding/index.ts': '',
      '/src/screens/editor/ui/styles.ts': '',
      '/src/screens/editor/index.ts': '',
      '/src/screens/export-worker/ui/ExportWorker.tsx': 'import { encode } from "@/entities/export-encoding"',
      '/src/screens/export-worker/index.ts': '',
    },
    originalFs,
  )
})

it('keeps the default pages layer behavior unchanged', async () => {
  const root = parseIntoFsdRoot(`
    📂 pages
      📂 settings
        📂 profile
          📄 index.ts
  `)

  const rule = fsd.plugin.ruleDefinitions.find((rule) => rule.name === 'fsd/no-segmentless-slices')

  expect(await Promise.resolve(rule?.check(root, {}))).toEqual({
    diagnostics: [
      {
        message: 'This slice has no segments. Consider dividing the code inside into segments.',
        location: { path: joinFromRoot('pages', 'settings', 'profile') },
      },
    ],
  })
})

it('applies layer aliases to import rules', async () => {
  const root = parseIntoFsdRoot(
    `
      📂 features
        📂 comments
          📂 ui
            📄 CommentCard.tsx
          📄 index.ts
      📂 screens
        📂 editor
          📂 ui
            📄 styles.ts
          📄 index.ts
    `,
    joinFromRoot('src'),
  )
  const fsdWithScreens = createFsdPlugin({ layerAliases: { pages: 'screens' } })
  const rule = fsdWithScreens.plugin.ruleDefinitions.find((rule) => rule.name === 'fsd/forbidden-imports')

  expect(await Promise.resolve(rule?.check(root, {}))).toEqual({
    diagnostics: [
      {
        message: 'Forbidden import from higher layer "screens".',
        location: { path: joinFromRoot('src', 'features', 'comments', 'ui', 'CommentCard.tsx') },
      },
    ],
  })
})

it('supports using a custom folder as an alias for a canonical FSD layer', async () => {
  const root = parseIntoFsdRoot(`
    📂 screens
      📂 settings
        📂 profile
          📄 index.ts
  `)
  const fsdWithScreens = createFsdPlugin({ layerAliases: { pages: 'screens' } })
  const rule = fsdWithScreens.plugin.ruleDefinitions.find((rule) => rule.name === 'fsd/no-segmentless-slices')

  expect(await Promise.resolve(rule?.check(root, {}))).toEqual({
    diagnostics: [
      {
        message: 'This slice has no segments. Consider dividing the code inside into segments.',
        location: { path: joinFromRoot('screens', 'settings', 'profile') },
      },
    ],
  })
})

it('reports aliased layer names in diagnostics', async () => {
  const root = parseIntoFsdRoot(`
    📂 screens
      📄 index.ts
  `)
  const fsdWithScreens = createFsdPlugin({ layerAliases: { pages: 'screens' } })
  const rule = fsdWithScreens.plugin.ruleDefinitions.find((rule) => rule.name === 'fsd/no-layer-public-api')

  expect(await Promise.resolve(rule?.check(root, {}))).toEqual({
    diagnostics: [
      {
        message: 'Layer "screens" should not have an index file',
        location: { path: joinFromRoot('screens', 'index.ts') },
      },
    ],
  })
})

it('reports aliased layer names in slice references', async () => {
  const root = parseIntoFsdRoot(
    `
      📂 entities
        📂 export-encoding
          📂 model
            📄 index.ts
          📄 index.ts
      📂 screens
        📂 export-worker
          📂 ui
            📄 ExportWorker.tsx
          📄 index.ts
    `,
    joinFromRoot('src'),
  )
  const fsdWithScreens = createFsdPlugin({ layerAliases: { pages: 'screens' } })
  const rule = fsdWithScreens.plugin.ruleDefinitions.find((rule) => rule.name === 'fsd/insignificant-slice')

  await expect(rule?.check(root, {})).resolves.toEqual({
    diagnostics: [
      {
        message: 'This slice has only one reference in slice "screens/export-worker". Consider merging them.',
        location: { path: joinFromRoot('src', 'entities', 'export-encoding') },
      },
    ],
  })
})
