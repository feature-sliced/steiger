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
  expect(dependencies).toEqual(['is-even'])
})

it('extracts cjs dependencies from TypeScript source code', async () => {
  const dependencies = await extractDependencies('/src/cjs.tsx')
  expect(dependencies).toEqual(['is-even'])
})

it('extracts dynamic dependencies from TypeScript source code', async () => {
  const dependencies = await extractDependencies('/src/dynamic.tsx')
  expect(dependencies).toEqual(['is-even'])
})
