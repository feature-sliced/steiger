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
    '/src/wildcard-exports.ts': [
      "export * from './model'",
      'export * from "./ui";',
      "export type * from './types'",
    ].join('\n'),
    '/src/explicit-exports.ts': [
      "export * as model from './model'",
      "export type * as types from './types'",
      "export { User, type UserData } from './model'",
      "export { Button } from './ui'",
      "import * as model from './model'",
      'export const version = 1',
      'export default version',
    ].join('\n'),
  }),
)

import { extractDependencies, extractWildcardExports } from './index.js'

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

it('extracts wildcard re-exports from TypeScript source code', async () => {
  expect(await extractWildcardExports('/src/wildcard-exports.ts')).toEqual([
    { path: './model', start: { line: 1, column: 1 }, end: { line: 1, column: 24 } },
    { path: './ui', start: { line: 2, column: 1 }, end: { line: 2, column: 22 } },
    { path: './types', start: { line: 3, column: 1 }, end: { line: 3, column: 29 } },
  ])
})

it('does not report namespace re-exports or other export forms', async () => {
  expect(await extractWildcardExports('/src/explicit-exports.ts')).toEqual([])
})
