import { expect, it, vi } from 'vitest'

import { createMockedNodeFs } from './mock-node-fs.js'

vi.mock('node:fs', () =>
  createMockedNodeFs({
    '/src/esm.tsx': `
    import isEven from 'is-even'
  `,
    '/src/cjs.tsx': `
    const isEven = require('is-even')
  `,
    '/src/dynamic.tsx': `
    async function foo() {
      const isEven = await import('is-even')
    }
  `,
    '/src/imports.ts': [
      "import './bare'",
      "import Default from './default'",
      "import * as ns from './namespace'",
      "import { foo as bar } from './named'",
      "import type { Foo } from './types'",
      "import('./dynamic')",
      "require('./cjs')",
    ].join('\n'),
    '/src/wildcard-exports.ts': [
      "export * from './model'",
      "export type * from './types'",
      "export * as ui from './ui'",
      "export type * as api from './api'",
    ].join('\n'),
    '/src/explicit-re-exports.ts': [
      "export { foo } from './foo'",
      "export { foo as bar } from './bar'",
      "export { type Foo } from './types'",
      "export { default as Baz } from './baz'",
    ].join('\n'),
    '/src/local-exports.ts': ['export const foo = 1', 'export default foo', 'export { foo }'].join('\n'),
    '/src/ordering.ts': [
      "const first = require('./first')",
      "import second from './second'",
      "export * from './third'",
    ].join('\n'),
  }),
)

import { analyzeModule, extractDependencies, extractReExports } from './index.js'

it('extracts esm dependencies from TypeScript source code', async () => {
  const dependencies = await extractDependencies('/src/esm.tsx')
  expect(dependencies).toEqual([
    { path: 'is-even', builtIn: false, dynamic: false, start: { line: 2, column: 25 }, end: { line: 2, column: 32 } },
  ])
})

it('extracts cjs dependencies from TypeScript source code', async () => {
  const dependencies = await extractDependencies('/src/cjs.tsx')
  expect(dependencies).toEqual([
    { path: 'is-even', builtIn: false, dynamic: false, start: { line: 2, column: 29 }, end: { line: 2, column: 36 } },
  ])
})

it('extracts dynamic dependencies from TypeScript source code', async () => {
  const dependencies = await extractDependencies('/src/dynamic.tsx')
  expect(dependencies).toEqual([
    { path: 'is-even', builtIn: false, dynamic: true, start: { line: 3, column: 36 }, end: { line: 3, column: 43 } },
  ])
})

it('extracts every form of import', async () => {
  expect(await extractDependencies('/src/imports.ts')).toEqual([
    { path: './bare', builtIn: false, dynamic: false, start: { line: 1, column: 9 }, end: { line: 1, column: 15 } },
    { path: './default', builtIn: false, dynamic: false, start: { line: 2, column: 22 }, end: { line: 2, column: 31 } },
    {
      path: './namespace',
      builtIn: false,
      dynamic: false,
      start: { line: 3, column: 22 },
      end: { line: 3, column: 33 },
    },
    { path: './named', builtIn: false, dynamic: false, start: { line: 4, column: 29 }, end: { line: 4, column: 36 } },
    { path: './types', builtIn: false, dynamic: false, start: { line: 5, column: 27 }, end: { line: 5, column: 34 } },
    { path: './dynamic', builtIn: false, dynamic: true, start: { line: 6, column: 9 }, end: { line: 6, column: 18 } },
    { path: './cjs', builtIn: false, dynamic: true, start: { line: 7, column: 10 }, end: { line: 7, column: 15 } },
  ])
})

it('extracts wildcard and namespace re-exports', async () => {
  expect(await extractReExports('/src/wildcard-exports.ts')).toEqual([
    {
      kind: 'all',
      source: './model',
      sourceRange: { start: { line: 1, column: 16 }, end: { line: 1, column: 23 } },
      statementRange: { start: { line: 1, column: 1 }, end: { line: 1, column: 24 } },
    },
    {
      kind: 'all',
      source: './types',
      sourceRange: { start: { line: 2, column: 21 }, end: { line: 2, column: 28 } },
      statementRange: { start: { line: 2, column: 1 }, end: { line: 2, column: 29 } },
    },
    {
      kind: 'namespace',
      source: './ui',
      exportedName: 'ui',
      sourceRange: { start: { line: 3, column: 22 }, end: { line: 3, column: 26 } },
      statementRange: { start: { line: 3, column: 1 }, end: { line: 3, column: 27 } },
    },
    {
      kind: 'namespace',
      source: './api',
      exportedName: 'api',
      sourceRange: { start: { line: 4, column: 28 }, end: { line: 4, column: 33 } },
      statementRange: { start: { line: 4, column: 1 }, end: { line: 4, column: 34 } },
    },
  ])
})

it('extracts explicit re-exports as named exports', async () => {
  expect(await extractReExports('/src/explicit-re-exports.ts')).toEqual([
    {
      kind: 'named',
      source: './foo',
      specifiers: [{ name: 'foo' }],
      sourceRange: { start: { line: 1, column: 22 }, end: { line: 1, column: 27 } },
      statementRange: { start: { line: 1, column: 1 }, end: { line: 1, column: 28 } },
    },
    {
      kind: 'named',
      source: './bar',
      specifiers: [{ name: 'foo', alias: 'bar' }],
      sourceRange: { start: { line: 2, column: 29 }, end: { line: 2, column: 34 } },
      statementRange: { start: { line: 2, column: 1 }, end: { line: 2, column: 35 } },
    },
    {
      kind: 'named',
      source: './types',
      specifiers: [{ name: 'Foo' }],
      sourceRange: { start: { line: 3, column: 27 }, end: { line: 3, column: 34 } },
      statementRange: { start: { line: 3, column: 1 }, end: { line: 3, column: 35 } },
    },
    {
      kind: 'named',
      source: './baz',
      specifiers: [{ name: 'default', alias: 'Baz' }],
      sourceRange: { start: { line: 4, column: 33 }, end: { line: 4, column: 38 } },
      statementRange: { start: { line: 4, column: 1 }, end: { line: 4, column: 39 } },
    },
  ])
})

it('ignores the exports a module declares itself, since they name no other module', async () => {
  expect(await extractReExports('/src/local-exports.ts')).toEqual([])
})

// The bundled tree-sitter grammar has no rule for `export … with { … }`: such a statement parses as
// a labeled statement, so it never reaches the re-export queries. Nothing in the extractor works
// around that, and this should start passing on its own once the grammar gains the rule.
it.todo('extracts a wildcard re-export that carries import attributes')

it('returns imports and re-exports in source order', async () => {
  const analysis = await analyzeModule('/src/ordering.ts')

  // `require` is matched by a later query than `import`, so without sorting `./second` would come first.
  expect(analysis.imports.map((moduleImport) => moduleImport.source)).toEqual(['./first', './second'])
  expect(analysis.reExports.map((reExport) => reExport.source)).toEqual(['./third'])
})

it('leaves re-exports out of the imports of a module', async () => {
  expect((await extractDependencies('/src/ordering.ts')).map((dependency) => dependency.path)).toEqual([
    './first',
    './second',
  ])
})
