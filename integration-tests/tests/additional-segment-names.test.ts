import * as fs from 'node:fs/promises'
import os from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'tinyexec'
import { expect, onTestFinished, test } from 'vitest'

import { getSteigerBinPath } from '../utils/get-bin-path.js'

const steiger = await getSteigerBinPath()
// Vitest does not expose import.meta.resolve, so resolve the package from Node.
const { stdout: pluginUrl } = await exec(
  process.execPath,
  ['--input-type=module', '--eval', "process.stdout.write(import.meta.resolve('@feature-sliced/steiger-plugin'))"],
  { nodeOptions: { cwd: fileURLToPath(new URL('..', import.meta.url)) }, throwOnError: true },
)

test.each([
  { name: 'reports bridge-only folders as segmentless with the default preset', configured: false },
  { name: 'recognizes bridge-only slices with additionalSegmentNames', configured: true },
])('$name', async ({ configured }) => {
  const project = await fs.mkdtemp(join(await fs.realpath(os.tmpdir()), 'steiger-segments-'))
  onTestFinished(() => fs.rm(project, { recursive: true, force: true }))

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
  const fixture = {
    [importer]: "import { pay } from '../../../payment/bridge/pay'\nexport { pay }\n",
    [join(payment, 'bridge', 'pay.ts')]: 'export const pay = () => {}\n',
    [join(standard, 'ui', 'button.ts')]: 'export const button = () => {}\n',
    [fileSegment]: 'export {}\n',
    [join(reservedFolder, 'internal.ts')]: 'export {}\n',
    [join(collisionSlice, 'ui', 'button.ts')]: 'export {}\n',
  }

  for (const [path, content] of Object.entries(fixture)) {
    await fs.mkdir(dirname(path), { recursive: true })
    await fs.writeFile(path, content)
  }

  await fs.writeFile(
    join(project, 'steiger.config.mjs'),
    `import fsd, { createFsdPlugin } from ${JSON.stringify(pluginUrl)}
const plugin = ${configured ? "createFsdPlugin({ additionalSegmentNames: ['bridge'] })" : 'fsd'}
export default [...plugin.configs.recommended]
`,
  )

  const result = await exec('node', [steiger, 'src', '--reporter=json'], { nodeOptions: { cwd: project } })
  expect(result.exitCode, result.stderr).toBe(1)
  const diagnostics = JSON.parse(result.stdout) as Array<{ ruleName: string; location: { path: string } }>
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
