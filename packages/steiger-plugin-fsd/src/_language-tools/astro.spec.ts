import { expect, it } from 'vitest'
import { extractDependencies } from './index.js'

it('extracts esm dependencies from Astro source code', async () => {
  const dependencies = await extractDependencies(
    'astro',
    `
    ---
    import Button from '@components/controls/Button.astro';
    import logoUrl from '@assets/logo.png?url';
    ---

    <h1>Hello</h1>
  `,
  )
  expect(dependencies).toEqual(['@components/controls/Button.astro', '@assets/logo.png?url'])
})
