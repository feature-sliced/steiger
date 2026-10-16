import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { processConfiguration, linter } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'
import { expect, test } from 'vitest'

const projectDir = dirname(fileURLToPath(import.meta.url))
const srcDir = join(projectDir, 'src')

test('https://github.com/feature-sliced/steiger/issues/276', async () => {
  processConfiguration(fsd.configs.recommended, projectDir)

  const result = await linter.run(srcDir)

  expect(result.some((r) => r.severity === 'warn')).toBe(false)
})
