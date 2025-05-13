import * as fs from 'node:fs/promises'
import os from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'tinyexec'

import { expect, test } from 'vitest'

import { getSteigerBinPath } from '../utils/get-bin-path.js'
import { getSnapshotPath } from '../utils/get-snapshot-path.js'
import { getRepoRootPath } from '../utils/get-repo-root-path.js'

const temporaryDirectory = await fs.realpath(os.tmpdir())
const repoRoot = getRepoRootPath()
const steiger = await getSteigerBinPath()
const kitchenSinkExample = join(dirname(fileURLToPath(import.meta.url)), '../../examples/kitchen-sink-of-fsd-issues')

test('basic functionality in the kitchen sink example project', { timeout: 30_000 }, async () => {
  const project = join(temporaryDirectory, 'smoke')
  await fs.rm(project, { recursive: true, force: true })
  await fs.mkdir(join(project, 'src'), { recursive: true })
  await fs.cp(join(kitchenSinkExample, 'src'), join(project, 'src'), { recursive: true })
  await fs.cp(join(kitchenSinkExample, 'tsconfig.app.json'), join(project, 'tsconfig.app.json'))
  await fs.cp(join(kitchenSinkExample, 'tsconfig.json'), join(project, 'tsconfig.json'))

  const steigerPluginPath = join(repoRoot, 'packages', 'steiger-plugin-fsd')
  const { stdout: steigerPluginTarball } = await exec('npm', ['pack'], {
    nodeOptions: { cwd: steigerPluginPath },
    throwOnError: true,
  })
  await exec('npm', ['install', join(steigerPluginPath, steigerPluginTarball.trim())], {
    nodeOptions: { cwd: project },
    throwOnError: true,
  })

  const { stderr } = await exec('node', [steiger, 'src'], { nodeOptions: { cwd: project, env: { NO_COLOR: '1' } } })

  await expect(stderr).toMatchFileSnapshot(getSnapshotPath('smoke-stderr'))

  await fs.rm(join(steigerPluginPath, steigerPluginTarball.trim()))
})
