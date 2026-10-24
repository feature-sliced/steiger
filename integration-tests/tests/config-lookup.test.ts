import * as fs from 'node:fs/promises'
import os from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { exec } from 'tinyexec'
import { expect, onTestFinished, test } from 'vitest'

import { getSteigerBinPath } from '../utils/get-bin-path.js'
import steigerPackageJson from '../../packages/steiger/package.json' with { type: 'json' }

const steiger = await getSteigerBinPath()
const fsdPluginUrl = pathToFileURL(
  join(dirname(fileURLToPath(import.meta.url)), '../../packages/steiger-plugin-fsd/dist/index.js'),
).href
const configPluginVersion = '123.456.789'

async function createWorkspace() {
  const workspace = await fs.mkdtemp(join(await fs.realpath(os.tmpdir()), 'steiger-config-lookup-'))
  onTestFinished(() => fs.rm(workspace, { recursive: true, force: true }))

  const cwd = join(workspace, 'caller')
  const project = join(workspace, 'target')
  await Promise.all([cwd, project].map((directory) => fs.mkdir(directory)))
  await Promise.all(
    [cwd, project].map((directory) => fs.writeFile(join(directory, 'package.json'), '{"private":true}')),
  )
  const target = join(project, 'src')
  await fs.mkdir(join(target, 'processes'), { recursive: true })
  await fs.writeFile(join(target, 'processes', 'file.ts'), 'export {}\n')

  return { workspace, cwd, project, target }
}

async function createMonorepo(initializeGit = true) {
  const { workspace, project } = await createWorkspace()
  const packageDirectory = join(project, 'packages', 'app')
  const target = join(packageDirectory, 'src')
  await fs.mkdir(join(target, 'processes'), { recursive: true })
  await fs.writeFile(join(target, 'processes', 'file.ts'), 'export {}\n')
  await fs.writeFile(join(packageDirectory, 'package.json'), '{"private":true}')

  if (initializeGit) {
    await exec('git', ['init', '--quiet', project], { timeout: 5000, throwOnError: true })
  }

  return { workspace, project, packageDirectory, target }
}

async function writeConfig(directory: string, severity: 'off' | 'warn' = 'off') {
  await fs.writeFile(
    join(directory, 'steiger.config.mjs'),
    `import fsd from ${JSON.stringify(fsdPluginUrl)}
export default [
  { ...fsd.plugin, meta: { ...fsd.plugin.meta, version: ${JSON.stringify(configPluginVersion)} } },
  { rules: { 'fsd/no-processes': ${JSON.stringify(severity)} } },
]
`,
  )
}

function runSteiger(cwd: string, args: Array<string>) {
  return exec('node', [steiger, ...args], {
    timeout: 5000,
    nodeOptions: { cwd, env: { NO_COLOR: '1' } },
  })
}

function expectProcessesDiagnostic(result: Awaited<ReturnType<typeof runSteiger>>, target: string) {
  expect(result.exitCode).toBe(1)
  expect(JSON.parse(result.stdout)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        ruleName: 'fsd/no-processes',
        severity: 'error',
        location: expect.objectContaining({ path: join(target, 'processes') }),
      }),
    ]),
  )
}

test('finds configuration above the target when invoked from a sibling directory', async () => {
  const { cwd, project, target } = await createWorkspace()
  await writeConfig(project, 'warn')

  const result = await runSteiger(cwd, [target, '--reporter=json'])

  expect(result.exitCode).toBe(0)
  expect(JSON.parse(result.stdout)).toEqual([
    expect.objectContaining({
      ruleName: 'fsd/no-processes',
      severity: 'warn',
      location: expect.objectContaining({ path: join(target, 'processes') }),
    }),
  ])
})

test('does not apply configuration from the working directory to a sibling target', async () => {
  const { cwd, target } = await createWorkspace()
  await writeConfig(cwd)

  expectProcessesDiagnostic(await runSteiger(cwd, [target, '--reporter=json']), target)
})

test.each([true, false])('inherits configuration through package boundaries with Git: %s', async (initializeGit) => {
  const { project, target } = await createMonorepo(initializeGit)
  await writeConfig(project, 'warn')

  const result = await runSteiger(project, [target, '--reporter=json'])

  expect(result.exitCode).toBe(0)
  expect(JSON.parse(result.stdout)).toEqual([
    expect.objectContaining({
      ruleName: 'fsd/no-processes',
      severity: 'warn',
      location: expect.objectContaining({ path: join(target, 'processes') }),
    }),
  ])
})

test('uses the nearest package configuration instead of the monorepo configuration', async () => {
  const { project, packageDirectory, target } = await createMonorepo()
  await writeConfig(project, 'warn')
  await writeConfig(packageDirectory)

  const result = await runSteiger(project, [target, '--reporter=json'])

  expect(result.exitCode).toBe(0)
  expect(JSON.parse(result.stdout)).toEqual([])
})

test('does not inherit configuration from above the Git repository', async () => {
  const { workspace, project, target } = await createMonorepo()
  await writeConfig(workspace)

  expectProcessesDiagnostic(await runSteiger(project, [target, '--reporter=json']), target)
})

test.each(['--help', '-h', '-wh'])('prints help for %s without selecting a target', async (flag) => {
  const { cwd } = await createWorkspace()
  await writeConfig(cwd)

  const result = await runSteiger(cwd, [flag])

  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain('steiger [options] <path>')
  expect(result.stdout).toContain('--ignore-warnings')
})

test.each(['--version', '-v', '-wv'])('prints version for %s using configuration from cwd', async (flag) => {
  const { cwd } = await createWorkspace()
  await writeConfig(cwd)

  const result = await runSteiger(cwd, [flag])

  expect(result.exitCode).toBe(0)
  expect(result.stdout.split('\n')[0]).toBe(steigerPackageJson.version)
  expect(result.stdout).toContain(`@feature-sliced/steiger-plugin\t${configPluginVersion}`)
})

test.each(['-something', '-archive', 'help'])('lints the path %s after the argument separator', async (name) => {
  const { cwd } = await createWorkspace()
  const target = join(cwd, name)
  await fs.mkdir(join(target, 'processes'), { recursive: true })
  await fs.writeFile(join(target, 'processes', 'file.ts'), 'export {}\n')

  expectProcessesDiagnostic(await runSteiger(cwd, ['--reporter=json', '--', name]), target)
})

test.each(['--help=false', '--version=false'])('lints the target for %s', async (flag) => {
  const { cwd, target } = await createWorkspace()

  expectProcessesDiagnostic(await runSteiger(cwd, [target, '--reporter=json', flag]), target)
})

const invalidArguments = [
  { args: ['first', 'second'], message: 'Pass only one path to watch' },
  { args: ['--ignore-warnings', '--fail-on-warnings'], message: 'mutually exclusive' },
]

test.each(invalidArguments)('rejects invalid arguments: $args', async ({ args, message }) => {
  const { cwd } = await createWorkspace()

  const result = await runSteiger(cwd, args)

  expect(result.exitCode).not.toBe(0)
  expect(result.stderr).toContain(message)
})

test.each(invalidArguments)('prints help despite invalid arguments: $args', async ({ args }) => {
  const { cwd } = await createWorkspace()

  const result = await runSteiger(cwd, [...args, '--help'])

  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain('steiger [options] <path>')
})

test.each([
  { args: ['anything', 'help'] },
  { args: ['help'] },
  { args: ['--ignore-warnings', '--fail-on-warnings', 'help'] },
])('prints positional help for $args without selecting a target', async ({ args }) => {
  const { cwd } = await createWorkspace()

  const result = await runSteiger(cwd, args)

  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain('steiger [options] <path>')
  expect(result.stdout).toContain('--ignore-warnings')
})
