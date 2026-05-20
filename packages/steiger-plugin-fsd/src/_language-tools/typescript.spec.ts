import { expect, it } from 'vitest'
import { extractDependencies } from './index.js'

it('extracts esm dependencies from TypeScript source code', async () => {
  const dependencies = await extractDependencies(
    'tsx',
    `
    import isEven from 'is-even'
  `,
  )
  expect(dependencies).toEqual(['is-even'])
})

it('extracts cjs dependencies from TypeScript source code', async () => {
  const dependencies = await extractDependencies(
    'tsx',
    `
    const isEven = require('is-even')
  `,
  )
  expect(dependencies).toEqual(['is-even'])
})

it('extracts dynamic dependencies from TypeScript source code', async () => {
  const dependencies = await extractDependencies(
    'tsx',
    `
    async function foo() {
      const isEven = await import('is-even')
    }
  `,
  )
  expect(dependencies).toEqual(['is-even'])
})
