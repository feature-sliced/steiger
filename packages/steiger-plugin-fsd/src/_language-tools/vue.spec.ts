import { expect, it } from 'vitest'
import { extractDependencies } from './index.js'

it('extracts esm dependencies from Vue source code', async () => {
  const dependencies = await extractDependencies(
    'vue',
    `
    <script>
      import Button from '@shared/ui/Button.vue';
    </script>

    <script lang="ts" setup>
      import { ref } from 'vue'
    </script>

    <h1>Hello</h1>
  `,
  )
  expect(dependencies).toEqual(['@shared/ui/Button.vue', 'vue'])
})
