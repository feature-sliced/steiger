import * as fs from 'node:fs/promises'
import os from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'tinyexec'

import { expect, test } from 'vitest'

import { getSteigerBinPath } from '../utils/get-bin-path.js'

const temporaryDirectory = await fs.realpath(os.tmpdir())
const steiger = await getSteigerBinPath()
const kitchenSinkExample = join(dirname(fileURLToPath(import.meta.url)), '../../examples/kitchen-sink-of-fsd-issues')
const pathPlatform = os.platform() === 'win32' ? 'windows' : 'posix'

test('basic functionality in the kitchen sink example project', async () => {
  const project = join(temporaryDirectory, 'smoke')
  await fs.rm(project, { recursive: true, force: true })
  await fs.cp(kitchenSinkExample, project, { recursive: true })

  const { stderr } = await exec('node', [steiger, 'src'], { nodeOptions: { cwd: project } })

  await expect(stderr).toMatchFileSnapshot(join('__snapshots__', `smoke-stderr-${pathPlatform}.txt`))
})
