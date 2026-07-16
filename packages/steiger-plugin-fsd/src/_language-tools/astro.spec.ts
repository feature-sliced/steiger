import { expect, it, vi } from 'vitest'

import { createMockedNodeFs } from './mock-node-fs.js'

vi.mock('node:fs', () =>
  createMockedNodeFs({
    '/src/Button.astro': `
---
import Button from '@components/controls/Button.astro';
import logoUrl from '@assets/logo.png?url';
---

<h1>Hello</h1>
  `,
  }),
)

import { extractDependencies } from './index.js'

it('extracts esm dependencies from Astro source code', async () => {
  const dependencies = await extractDependencies('/src/Button.astro')
  expect(dependencies).toEqual([
    {
      path: '@components/controls/Button.astro',
      builtIn: false,
      dynamic: false,
      line: 3,
      column: 21,
      end: { line: 3, column: 54 },
    },
    { path: '@assets/logo.png?url', builtIn: false, dynamic: false, line: 4, column: 22, end: { line: 4, column: 42 } },
  ])
})
