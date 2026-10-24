import * as fs from 'node:fs/promises'
import os from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { exec } from 'tinyexec'
import { replaceSymbols } from 'figures'

import { expect, test } from 'vitest'

import { getSteigerBinPath } from '../utils/get-bin-path.js'

const temporaryDirectory = await fs.realpath(os.tmpdir())
const steiger = await getSteigerBinPath()
const kitchenSinkExample = join(dirname(fileURLToPath(import.meta.url)), '../../examples/kitchen-sink-of-fsd-issues')
const fsdPluginUrl = pathToFileURL(
  join(dirname(fileURLToPath(import.meta.url)), '../../packages/steiger-plugin-fsd/dist/index.js'),
).href
const pathPlatform = os.platform() === 'win32' ? 'windows' : 'posix'

test('ignores warnings in the kitchen sink example project', async () => {
  const project = join(temporaryDirectory, 'ignore-warnings')

  await fs.rm(project, { recursive: true, force: true })
  await fs.cp(kitchenSinkExample, project, { recursive: true })

  await fs.writeFile(
    join(project, 'steiger.config.mjs'),
    `
import fsd from ${JSON.stringify(fsdPluginUrl)}

export default [
  fsd.plugin,
  {
    rules: {
      'fsd/no-ui-in-app': 'error',
      'fsd/no-processes': 'warn',
    },
  },
]
`,
  )

  let { stderr: regularStderr } = await exec('node', [steiger, 'src'], {
    nodeOptions: {
      cwd: project,
      env: { NO_COLOR: '1' },
    },
  })

  const ignoreWarningsRun = await exec('node', [steiger, 'src', '--ignore-warnings'], {
    nodeOptions: {
      cwd: project,
      env: { NO_COLOR: '1' },
    },
  })

  let ignoreWarningsStderr = ignoreWarningsRun.stderr

  regularStderr = replaceSymbols(regularStderr, {
    useFallback: true,
  })
  ignoreWarningsStderr = replaceSymbols(ignoreWarningsStderr, {
    useFallback: true,
  })

  expect(ignoreWarningsRun.exitCode).toBe(1)

  await expect(
    ['Without --ignore-warnings:', regularStderr, 'With --ignore-warnings:', ignoreWarningsStderr].join('\n'),
  ).toMatchFileSnapshot(join('__snapshots__', `ignore-warnings-stderr-${pathPlatform}.txt`))
}, 15_000)

test('does not allow ignore-warnings with fail-on-warnings', async () => {
  const project = join(temporaryDirectory, 'conflicting-warning-options')

  await fs.rm(project, { recursive: true, force: true })
  await fs.cp(kitchenSinkExample, project, {
    recursive: true,
  })

  const result = await exec('node', [steiger, 'src', '--ignore-warnings', '--fail-on-warnings'], {
    nodeOptions: {
      cwd: project,
      env: { NO_COLOR: '1' },
    },
  })

  expect(result.exitCode).not.toBe(0)
  expect(result.stderr).toContain('mutually exclusive')
})
