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
    '/src/re-exports.ts': [
      'import { a } from "./a";',
      '',
      'export { b } from "./b";',
      'export { b as c } from "./b";',
      '',
      'export * from "./c";',
      'export * as ns from "./d";',
      '',
      'export type { Foo } from "./types";',
      'export type * from "./types2";',
      'export type * as Types from "./types3";',
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

it('extracts every form of re-export with its kind and ranges, in source order', async () => {
  expect(await extractReExports('/src/re-exports.ts')).toEqual([
    {
      type: 're-export',
      kind: 'named',
      source: './b',
      builtIn: false,
      sourceRange: { start: { line: 3, column: 20 }, end: { line: 3, column: 23 } },
      statementRange: { start: { line: 3, column: 1 }, end: { line: 3, column: 25 } },
    },
    {
      type: 're-export',
      kind: 'named',
      source: './b',
      builtIn: false,
      sourceRange: { start: { line: 4, column: 25 }, end: { line: 4, column: 28 } },
      statementRange: { start: { line: 4, column: 1 }, end: { line: 4, column: 30 } },
    },
    {
      type: 're-export',
      kind: 'wildcard',
      source: './c',
      builtIn: false,
      sourceRange: { start: { line: 6, column: 16 }, end: { line: 6, column: 19 } },
      statementRange: { start: { line: 6, column: 1 }, end: { line: 6, column: 21 } },
    },
    {
      type: 're-export',
      kind: 'namespace',
      source: './d',
      builtIn: false,
      sourceRange: { start: { line: 7, column: 22 }, end: { line: 7, column: 25 } },
      statementRange: { start: { line: 7, column: 1 }, end: { line: 7, column: 27 } },
    },
    {
      type: 're-export',
      kind: 'named',
      source: './types',
      builtIn: false,
      sourceRange: { start: { line: 9, column: 27 }, end: { line: 9, column: 34 } },
      statementRange: { start: { line: 9, column: 1 }, end: { line: 9, column: 36 } },
    },
    {
      type: 're-export',
      kind: 'wildcard',
      source: './types2',
      builtIn: false,
      sourceRange: { start: { line: 10, column: 21 }, end: { line: 10, column: 29 } },
      statementRange: { start: { line: 10, column: 1 }, end: { line: 10, column: 31 } },
    },
    {
      type: 're-export',
      kind: 'namespace',
      source: './types3',
      builtIn: false,
      sourceRange: { start: { line: 11, column: 30 }, end: { line: 11, column: 38 } },
      statementRange: { start: { line: 11, column: 1 }, end: { line: 11, column: 40 } },
    },
  ])
})

it('keeps imports and re-exports of one module in a single source-ordered list', async () => {
  const { statements } = await analyzeModule('/src/re-exports.ts')

  expect(statements.map((statement) => [statement.type, statement.source])).toEqual([
    ['import', './a'],
    ['re-export', './b'],
    ['re-export', './b'],
    ['re-export', './c'],
    ['re-export', './d'],
    ['re-export', './types'],
    ['re-export', './types2'],
    ['re-export', './types3'],
  ])
})

it('extracts explicit re-exports as named re-exports', async () => {
  expect((await extractReExports('/src/explicit-re-exports.ts')).map(({ kind, source }) => ({ kind, source }))).toEqual(
    [
      { kind: 'named', source: './foo' },
      { kind: 'named', source: './bar' },
      { kind: 'named', source: './types' },
      { kind: 'named', source: './baz' },
    ],
  )
})

it('ignores the exports a module declares itself, since they name no other module', async () => {
  expect(await extractReExports('/src/local-exports.ts')).toEqual([])
})

// The bundled tree-sitter grammar has no rule for `export ... with { ... }`, so the statement parses
// as a labeled statement and never reaches the re-export query. This should pass once the grammar
// gains the rule.
it.todo('extracts a wildcard re-export that carries import attributes')

it('returns imports and re-exports in source order', async () => {
  const { statements } = await analyzeModule('/src/ordering.ts')

  // `require` is matched by a later query than `import`, so without sorting `./second` would come first.
  expect(statements.map((statement) => statement.source)).toEqual(['./first', './second', './third'])
})

it('leaves re-exports out of the imports of a module', async () => {
  expect((await extractDependencies('/src/ordering.ts')).map((dependency) => dependency.path)).toEqual([
    './first',
    './second',
  ])
})
