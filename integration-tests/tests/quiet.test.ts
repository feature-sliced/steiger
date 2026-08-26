import * as fs from 'node:fs/promises'
import os from 'node:os'
import { join } from 'node:path'

import { exec } from 'tinyexec'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import { getSteigerBinPath } from '../utils/get-bin-path.js'

const temporaryDirectory = await fs.realpath(os.tmpdir())
const steiger = await getSteigerBinPath()

const projectsDirectory = join(temporaryDirectory, `steiger-quiet-${process.pid}`)
const mixedProject = join(projectsDirectory, 'mixed')
const warningOnlyProject = join(projectsDirectory, 'warning-only')

const createProject = async (project: string, rules: Record<string, 'error' | 'warn'>) => {
  await fs.mkdir(join(project, 'src'), { recursive: true })
  await fs.writeFile(join(project, 'src', 'index.ts'), 'export {}\n')

  const config = `
const { join } = require('node:path')

const plugin = {
  meta: {
    name: 'quiet-test',
    version: '1.0.0',
  },
  ruleDefinitions: [
    {
      name: 'quiet-test/warning',
      check(root) {
        return {
          diagnostics: [
            {
              message: 'warning diagnostic',
              location: { path: join(root.path, 'index.ts') },
            },
          ],
        }
      },
    },
    {
      name: 'quiet-test/error',
      check(root) {
        return {
          diagnostics: [
            {
              message: 'error diagnostic',
              location: { path: join(root.path, 'index.ts') },
            },
          ],
        }
      },
    },
  ],
}

module.exports = [
  plugin,
  {
    rules: ${JSON.stringify(rules)},
  },
]
`

  await fs.writeFile(join(project, 'steiger.config.js'), config)
}

const runSteiger = (project: string, args: Array<string> = []) =>
  exec('node', [steiger, 'src', ...args], {
    nodeOptions: {
      cwd: project,
      env: { NO_COLOR: '1' },
    },
  })

beforeAll(async () => {
  await fs.rm(projectsDirectory, { recursive: true, force: true })

  await createProject(mixedProject, {
    'quiet-test/warning': 'warn',
    'quiet-test/error': 'error',
  })

  await createProject(warningOnlyProject, {
    'quiet-test/warning': 'warn',
  })
})

afterAll(async () => {
  await fs.rm(projectsDirectory, { recursive: true, force: true })
})

describe('--quiet', () => {
  test('reports warnings and errors without --quiet', async () => {
    const result = await runSteiger(mixedProject)

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('quiet-test/warning')
    expect(result.stderr).toContain('quiet-test/error')
  })

  test('reports only errors with --quiet', async () => {
    const result = await runSteiger(mixedProject, ['--quiet'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr).not.toContain('quiet-test/warning')
    expect(result.stderr).toContain('quiet-test/error')
  })

  test('returns exit code 0 for warnings with --quiet', async () => {
    const result = await runSteiger(warningOnlyProject, ['--quiet'])

    expect(result.exitCode).toBe(0)
    expect(result.stderr).not.toContain('quiet-test/warning')
  })

  test('preserves --fail-on-warnings behavior with --quiet', async () => {
    const result = await runSteiger(warningOnlyProject, ['--quiet', '--fail-on-warnings'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr).not.toContain('quiet-test/warning')
  })

  test('filters warnings from JSON output', async () => {
    const result = await runSteiger(mixedProject, ['--quiet', '--reporter', 'json'])

    const diagnostics = JSON.parse(result.stdout) as Array<{
      severity: string
    }>

    expect(result.exitCode).toBe(1)
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.severity).toBe('error')
  })
})
