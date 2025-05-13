import * as fs from 'node:fs/promises'
import os from 'node:os'
import { join } from 'node:path'
import type { ChildProcess } from 'node:child_process'

import { expect, test } from 'vitest'
import { createViteProject } from '../utils/create-vite-project.js'
import { exec } from 'tinyexec'
import { getSteigerBinPath } from '../utils/get-bin-path.js'
import { getRepoRootPath } from '../utils/get-repo-root-path.js'

const temporaryDirectory = await fs.realpath(os.tmpdir())
const repoRoot = getRepoRootPath()
const steiger = await getSteigerBinPath()

test('auto plugin discovery', { timeout: 60_000 }, async () => {
  const project = join(temporaryDirectory, 'auto-discovery')
  await createViteProject(project)

  const plugin = join(temporaryDirectory, 'custom-steiger-plugin')
  await createDummySteigerPlugin(plugin)

  await exec('npm', ['install'], { nodeOptions: { cwd: plugin } })
  await exec('npm', ['add', `steiger-plugin-dummy@file:${plugin}`], { nodeOptions: { cwd: project } })

  function getDetectedPlugins(versionOutput: string) {
    const [_steigerVersion, plugins] = versionOutput.trim().split('\n\n', 2)
    return plugins.split('\n').map((line) => ({ name: line.split('\t')[0], version: line.split('\t')[1] }))
  }

  const resultWithOnlyDummy = await exec(steiger, ['-v'], { nodeOptions: { cwd: project, env: { NO_COLOR: '1' } } })
  expect(resultWithOnlyDummy.stderr).toEqual('')
  expect(getDetectedPlugins(resultWithOnlyDummy.stdout)).toEqual([
    { name: 'steiger-plugin-dummy', version: '1.0.0-alpha.0' },
  ])

  await exec(
    'npm',
    ['add', `@feature-sliced/steiger-plugin@file:${join(repoRoot, 'packages', 'steiger-plugin-fsd')}`],
    { nodeOptions: { cwd: project } },
  )

  const resultWithDummyAndFsd = await exec(steiger, ['-v'], { nodeOptions: { cwd: project, env: { NO_COLOR: '1' } } })
  expect(resultWithDummyAndFsd.stderr).toEqual('')
  expect(getDetectedPlugins(resultWithDummyAndFsd.stdout)).toEqual([
    { name: '@feature-sliced/steiger-plugin', version: expect.any(String) },
    { name: 'steiger-plugin-dummy', version: '1.0.0-alpha.0' },
  ])
})

test('suggestion to install the FSD plugin', { timeout: 4 * 60_000 }, async () => {
  const project = join(temporaryDirectory, 'suggest-fsd-plugin')
  await createViteProject(project)

  const execResult = exec(steiger, ['./src'], {
    nodeOptions: { stdio: 'pipe', cwd: project, env: { NO_COLOR: '1', npm_config_user_agent: undefined } },
  })
  const steigerProcess = execResult.process!

  await expect(getNewProcessOutput(steigerProcess, { until: '○ No' })).resolves.toContain(
    "Couldn't find any plugins in package.json. Are you trying to check this project's compliance to Feature-Sliced Design (https://feature-sliced.design)?",
  )
  console.log('got first batch of output')
  steigerProcess.stdin?.write('y')

  await expect(getNewProcessOutput(steigerProcess, { until: '○ No' })).resolves.toContain(
    'Okay! Would you like to run `npm add -D @feature-sliced/steiger-plugin` in suggest-fsd-plugin (path: .) to install the FSD plugin?',
  )
  console.log('got second batch of output')
  steigerProcess.stdin?.write('y')

  await expect(getNewProcessOutput(steigerProcess, { until: 'All done!' })).resolves.toContain(
    "All done! Now let's run the FSD checks.",
  )
  console.log('got third batch of output')

  const packageJson = (await fs
    .readFile(join(project, 'package.json'), { encoding: 'utf-8' })
    .then(JSON.parse)) as Record<string, Record<string, string>>
  expect(packageJson.devDependencies['@feature-sliced/steiger-plugin']).not.toBeUndefined()
  await expect(getNewProcessOutput(execResult.process!, { stream: 'stderr' })).resolves.toContain('No problems found!')
  await execResult
  expect(execResult.exitCode).toEqual(0)
})

async function createDummySteigerPlugin(location: string) {
  await fs.rm(location, { recursive: true, force: true })
  await fs.mkdir(location, { recursive: true })
  const packageJsonContents = JSON.stringify(
    {
      name: 'steiger-plugin-dummy',
      version: '1.0.0-alpha.0',
      type: 'module',
      exports: {
        import: './index.mjs',
      },
      dependencies: {
        '@steiger/toolkit': `file:${join(repoRoot, 'packages', 'toolkit')}`,
      },
    },
    null,
    2,
  )
  await fs.writeFile(join(location, 'package.json'), packageJsonContents)

  const indexMjsContents = `
    import { enableAllRules, createPlugin, createConfigs } from '@steiger/toolkit';

    const plugin = createPlugin({
      meta: {
        name: 'steiger-plugin-dummy',
        version: '1.0.0-alpha.0',
      },
      ruleDefinitions: [
        {
          name: 'dummy/rule1',
          check(root) {
            return { diagnostics: [{ message: 'Root detected', location: { path: root.path } }] };
          },
        },
      ],
    });

    const configs = createConfigs({
      recommended: enableAllRules(plugin),
    });

    export default {
      plugin,
      configs,
    };
  `
  await fs.writeFile(join(location, 'index.mjs'), indexMjsContents)
}

/**
 * Read the stdout/stderr stream of the process until the specified string is found.
 *
 * If no string is specified, it will return the first chunk of output.
 */
function getNewProcessOutput(
  process: ChildProcess,
  { until, stream = 'stdout' }: { until?: string; stream?: 'stdout' | 'stderr' } = {},
): Promise<string> {
  return new Promise((resolve) => {
    let output = ''
    function onData(data: string) {
      output += data
      if (until === undefined || output.includes(until)) {
        process[stream]?.off('data', onData)
        resolve(output)
      }
    }
    process[stream]?.on('data', onData)
  })
}
