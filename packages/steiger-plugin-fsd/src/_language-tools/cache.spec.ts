import { expect, it, vi } from 'vitest'

import { createMockedNodeFs } from './mock-node-fs.js'

const readPaths: string[] = []

vi.mock('node:fs', async () => {
  const mocked = await createMockedNodeFs({
    '/src/module.ts': ["import './dependency'", "export * from './re-exported'"].join('\n'),
  })

  return {
    ...mocked,
    readFileSync: ((path: string, options: never) => {
      readPaths.push(path)
      return mocked.readFileSync(path, options)
    }) as typeof mocked.readFileSync,
  }
})

import { extractDependencies, extractReExports } from './index.js'

it('parses a file once and serves its imports and re-exports from one analysis', async () => {
  expect((await extractDependencies('/src/module.ts')).map((dependency) => dependency.path)).toEqual(['./dependency'])
  expect((await extractReExports('/src/module.ts')).map((reExport) => reExport.source)).toEqual(['./re-exported'])

  await extractDependencies('/src/module.ts')
  await extractReExports('/src/module.ts')

  expect(readPaths.filter((path) => path === '/src/module.ts')).toHaveLength(1)
})
