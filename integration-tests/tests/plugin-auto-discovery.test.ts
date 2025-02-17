import * as fs from 'node:fs/promises'
import os from 'node:os'
import { join } from 'node:path'

import { expect, test } from 'vitest'
import { createViteProject } from '../utils/create-vite-project.js'
import { exec } from 'tinyexec'
import { getSteigerBinPath } from '../utils/get-bin-path.js'
import { getSnapshotPath } from '../utils/get-snapshot-path.js'

const temporaryDirectory = await fs.realpath(os.tmpdir())
const steiger = await getSteigerBinPath()

test(
  'auto plugin discovery works',
  async () => {
    const project = join(temporaryDirectory, 'auto-discovery')
    await createViteProject(project)

    const plugin = join(temporaryDirectory, 'custom-steiger-plugin')
    await createDummySteigerPlugin(plugin)

    await exec('npm', ['install'], { nodeOptions: { cwd: plugin } })
    await exec('npm', ['add', `steiger-plugin-dummy@file:${plugin}`], { nodeOptions: { cwd: project } })

    const { stderr } = await exec(steiger, ['-v'], { nodeOptions: { cwd: project, env: { NO_COLOR: '1' } } })
    await expect(stderr).toMatchFileSnapshot(getSnapshotPath('auto-discovery-stderr'))
  },
  { timeout: 15_000 },
)

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
        '@steiger/toolkit': '*',
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
