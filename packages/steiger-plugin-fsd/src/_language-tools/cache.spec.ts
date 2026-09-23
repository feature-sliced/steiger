import { expect, it, vi } from 'vitest'
import { Parser } from 'web-tree-sitter'

import { createMockedNodeFs } from './mock-node-fs.js'

vi.mock('node:fs', () =>
  createMockedNodeFs({
    '/src/module.ts': ["import './dependency'", "export * from './re-exported'"].join('\n'),
  }),
)

import { analyzeModule, extractDependencies, extractReExports } from './index.js'

it('parses a file once and serves its imports and re-exports from one analysis', async () => {
  const parse = vi.spyOn(Parser.prototype, 'parse')

  expect((await extractDependencies('/src/module.ts')).map((dependency) => dependency.path)).toEqual(['./dependency'])
  expect((await extractReExports('/src/module.ts')).map((reExport) => reExport.source)).toEqual(['./re-exported'])

  await extractDependencies('/src/module.ts')
  await extractReExports('/src/module.ts')

  expect(parse).toHaveBeenCalledTimes(1)
})

it('returns the same cached analysis object for the same unchanged file', async () => {
  const first = await analyzeModule('/src/module.ts')
  const second = await analyzeModule('/src/module.ts')

  expect(second).toBe(first)
})
