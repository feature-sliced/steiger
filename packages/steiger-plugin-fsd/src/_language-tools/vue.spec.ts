import { expect, it, vi } from 'vitest'

import { createMockedNodeFs } from './mock-node-fs.js'

vi.mock('node:fs', () =>
  createMockedNodeFs({
    '/src/App.vue': `
    <script>
      import Button from '@shared/ui/Button.vue';
    </script>

    <script lang="ts" setup>
      import { ref } from 'vue'
    </script>

    <h1>Hello</h1>
  `,
  }),
)

import { extractDependencies } from './index.js'

it('extracts esm dependencies from Vue source code', async () => {
  const dependencies = await extractDependencies('/src/App.vue')
  expect(dependencies).toEqual([
    {
      path: '@shared/ui/Button.vue',
      builtIn: false,
      dynamic: false,
      line: 3,
      column: 27,
      end: { line: 3, column: 48 },
    },
    { path: 'vue', builtIn: false, dynamic: false, line: 7, column: 28, end: { line: 7, column: 31 } },
  ])
})
