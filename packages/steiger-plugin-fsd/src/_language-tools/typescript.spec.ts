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
  }),
)

import { extractDependencies } from './index.js'

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
