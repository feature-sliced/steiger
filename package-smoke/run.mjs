// Packs the published packages, installs the tarballs into a clean project outside of this repository,
// and checks that the project can use them the way a real consumer would.
//
// The build must be done before running this script: `turbo run build && node package-smoke/run.mjs`

import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** A rule that the fixture violates on purpose, to prove that the plugin is loaded and its rules run. */
const violatedRule = 'fsd/public-api'

const repoRoot = join(import.meta.dirname, '..')
const packagesFolder = join(repoRoot, 'packages')
// Inside the repository, Node would resolve packages like Vitest from the workspace's `node_modules`.
const workFolder = mkdtempSync(join(tmpdir(), 'steiger-smoke-test-'))
const tarballsFolder = join(workFolder, 'tarballs')
const projectFolder = join(workFolder, 'project')

function run(command, args, { cwd = projectFolder, expectedStatus = 0 } = {}) {
  console.log(`\n$ ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' })
  if (result.error) {
    throw result.error
  }
  const output = result.stdout + result.stderr
  if (result.status !== expectedStatus) {
    console.error(output)
    throw new Error(`Expected exit code ${expectedStatus}, got ${result.status}`)
  }
  return output
}

/** Tarballs of the packages that get published, by package name. */
const tarballs = {}
for (const folder of readdirSync(packagesFolder)) {
  const packageFolder = join(packagesFolder, folder)
  if (JSON.parse(readFileSync(join(packageFolder, 'package.json'), 'utf8')).private) {
    continue
  }
  const { name, filename } = JSON.parse(
    run('pnpm', ['pack', '--json', '--pack-destination', tarballsFolder], { cwd: packageFolder }),
  )
  tarballs[name] = `file:${filename}`
}

cpSync(join(import.meta.dirname, 'fixture'), projectFolder, { recursive: true })
const packageJsonPath = join(projectFolder, 'package.json')
writeFileSync(
  packageJsonPath,
  JSON.stringify(
    {
      ...JSON.parse(readFileSync(packageJsonPath, 'utf8')),
      dependencies: tarballs,
      // Without the overrides, packages that depend on each other would be installed from the registry.
      pnpm: { overrides: tarballs },
    },
    null,
    2,
  ),
)
run('pnpm', ['install'])

// Make sure that no package was installed from the registry instead of its tarball.
// The lockfile is matched as text to avoid depending on a YAML parser.
const lockfile = readFileSync(join(projectFolder, 'pnpm-lock.yaml'), 'utf8')
for (const name of Object.keys(tarballs)) {
  const versions = [...lockfile.matchAll(new RegExp(`(?<![\\w@/.-])${name}@([^:'\\s]+)`, 'g'))].map(
    ([, version]) => version,
  )
  // No matches at all means that the lockfile format has changed, which must not pass silently.
  if (versions.length === 0 || versions.some((version) => version !== 'file')) {
    throw new Error(`Expected ${name} to be installed from the tarball, found [${versions.join(', ')}] in the lockfile`)
  }
}

for (const name of Object.keys(tarballs)) {
  run('node', ['--input-type=module', '--eval', `await import('${name}')`])
}

run('pnpm', ['exec', 'steiger', '--version'])

const report = run('pnpm', ['exec', 'steiger', './src'], { expectedStatus: 1 })
if (!report.includes(violatedRule)) {
  console.error(report)
  throw new Error(`Expected Steiger to report a violation of ${violatedRule}`)
}

run('pnpm', ['exec', 'tsc'])

rmSync(workFolder, { recursive: true })
console.log('\nThe packed packages work in a clean project.')
