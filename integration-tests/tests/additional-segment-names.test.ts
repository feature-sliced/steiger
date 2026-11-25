import { join } from 'node:path'
import mock from 'mock-fs'
import { linter, processScopedConfiguration } from 'steiger'
import { createFsdPlugin } from '@feature-sliced/steiger-plugin'
import { afterEach, expect, test } from 'vitest'

// The project exists only in mock-fs, so the test writes nothing to disk.
const project = join('/', 'project')
const source = join(project, 'src')
const checkout = join(source, 'features', 'billing', 'checkout')
const payment = join(source, 'features', 'payment')
const standard = join(source, 'features', 'standard')
const importer = join(checkout, 'bridge', 'checkout.ts')
const fileSegmentSlice = join(source, 'features', 'legacy-file')
const fileSegment = join(fileSegmentSlice, 'bridge.ts')
const collisionGroup = join(source, 'features', 'migration')
const collisionSlice = join(collisionGroup, 'bridge')
const reservedFolder = join(payment, 'bridge', '@x')

afterEach(() => mock.restore())

test.each([
  { name: 'reports bridge-only folders as segmentless with the default preset', configured: false },
  { name: 'recognizes bridge-only slices with additionalSegments', configured: true },
])('$name', async ({ configured }) => {
  mock({
    [importer]: "import { pay } from '../../../payment/bridge/pay'\nexport { pay }\n",
    [join(payment, 'bridge', 'pay.ts')]: 'export const pay = () => {}\n',
    [join(standard, 'ui', 'button.ts')]: 'export const button = () => {}\n',
    [fileSegment]: 'export {}\n',
    [join(reservedFolder, 'internal.ts')]: 'export {}\n',
    [join(collisionSlice, 'ui', 'button.ts')]: 'export {}\n',
  })

  const fsd = configured ? createFsdPlugin({ additionalSegments: ['bridge'] }) : createFsdPlugin()
  const config = processScopedConfiguration([...fsd.configs.recommended], project)

  const diagnostics = await linter.run(source, { config })
  const locations = (rule: string) =>
    diagnostics
      .filter((diagnostic) => diagnostic.ruleName === `fsd/${rule}`)
      .map((diagnostic) => diagnostic.location.path)
      .sort()

  expect(locations('no-segmentless-slices')).toEqual(
    configured ? [] : [join(checkout, 'bridge'), payment, fileSegmentSlice].sort(),
  )
  expect(locations('public-api')).toEqual(
    configured
      ? [checkout, payment, standard, fileSegmentSlice, collisionGroup].sort()
      : [standard, collisionSlice].sort(),
  )
  expect(locations('forbidden-imports')).toEqual(configured ? [importer] : [])
  expect(locations('no-reserved-folder-names')).toEqual(
    configured ? [join(collisionSlice, 'ui'), reservedFolder].sort() : [],
  )
})
