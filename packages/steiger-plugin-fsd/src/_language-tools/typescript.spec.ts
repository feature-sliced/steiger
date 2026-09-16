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
    '/src/re-export.tsx': `export { isEven } from 'is-even'
export * from 'is-odd'
`,
    '/src/mixed.tsx': `import used from 'used'
export * from 're-exported'
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

it('only reports re-exported modules when asked to', async () => {
  expect(await extractDependencies('/src/re-export.tsx')).toEqual([])

  const dependencies = await extractDependencies('/src/re-export.tsx', { includeReExports: true })
  expect(dependencies).toEqual([
    {
      path: 'is-even',
      builtIn: false,
      dynamic: false,
      reExport: true,
      start: { line: 1, column: 25 },
      end: { line: 1, column: 32 },
    },
    {
      path: 'is-odd',
      builtIn: false,
      dynamic: false,
      reExport: true,
      start: { line: 2, column: 16 },
      end: { line: 2, column: 22 },
    },
  ])
})

it('returns the same results no matter in which order the options are requested', async () => {
  // The parsed dependencies are cached per file, unfiltered. `includeReExports`, like `includeBuiltIns`
  // and `importType`, may only filter the cached result and must never change what gets parsed and
  // cached. Otherwise whichever call ran first would decide what every later call can see.

  // First call with re-exports on fills the cache; a later call with them off must still exclude them.
  const withReExports = await extractDependencies('/src/mixed.tsx', { includeReExports: true })
  expect(withReExports.map((dependency) => dependency.path)).toEqual(['used', 're-exported'])

  const withoutReExports = await extractDependencies('/src/mixed.tsx')
  expect(withoutReExports.map((dependency) => dependency.path)).toEqual(['used'])

  // And the other way around: a cache filled by a plain call must still hold the re-exports.
  const plainFirst = await extractDependencies('/src/re-export.tsx')
  expect(plainFirst).toEqual([])

  const reExportsAfterPlain = await extractDependencies('/src/re-export.tsx', { includeReExports: true })
  expect(reExportsAfterPlain.map((dependency) => dependency.path)).toEqual(['is-even', 'is-odd'])
})
