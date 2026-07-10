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
  expect(dependencies).toEqual(['@shared/ui/Button.vue', 'vue'])
})
