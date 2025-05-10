import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { join } from 'node:path'
import * as pkg from 'empathic/package'
import { ResolverFactory } from 'oxc-resolver'
import type { Plugin, Config, Rule } from '@steiger/types'

import { parsePackage } from './parse-package'
import { isSteigerPlugin } from './is-steiger-plugin'
import { parsePluginDefaultExport } from './parse-plugin-default-export'

type Configs = Record<string, Config<Array<Rule>>>

const resolve = new ResolverFactory({
  conditionNames: ['node', 'import'],
})

/**
 * Locate the nearest package.json and search for packages whose names adhere to the naming convention for Steiger plugins.
 *
 * For each plugin, returns the plugin object and the optimal configuration, if any.
 */
export async function discoverPlugins(): Promise<
  Array<{ plugin: Plugin; autoConfig: Config<Array<Rule>> | undefined }>
> {
  const packageJsonPath = pkg.up()

  if (packageJsonPath === undefined) {
    return []
  }

  try {
    const pluginNames = await extractAllDependencies(packageJsonPath).then((deps) => deps.filter(isSteigerPlugin))

    return Promise.all(
      pluginNames.map((pluginName) =>
        loadSteigerPlugin(pluginName).then(({ plugin, configs }) => ({
          plugin,
          autoConfig: findOptimalAutoConfig(configs),
        })),
      ),
    )
  } catch {
    return []
  }
}

/** Extract the names of dependencies and dev dependencies from a package.json file given its path. */
async function extractAllDependencies(packageJsonPath: string): Promise<Array<string>> {
  const packageJson = await readFile(packageJsonPath, 'utf-8').then(JSON.parse).then(parsePackage)
  const dependencies = Object.keys(packageJson.dependencies || {})
  const devDependencies = Object.keys(packageJson.devDependencies || {})
  return [...dependencies, ...devDependencies]
}

/**
 * Load a Steiger plugin by package name.
 *
 * This assumes that the plugin can be resolved from the current working directory,
 * i.e. the code in the current working directory would be able to import it.
 */
async function loadSteigerPlugin(pluginName: string): Promise<{ plugin: Plugin; configs: Configs }> {
  const pluginIndex = await resolve.async(process.cwd(), pluginName)
  if (pluginIndex.path === undefined) {
    throw new Error(`Could not resolve plugin ${pluginName}`)
  }
  const pluginExports = await import(pluginIndex.path)
  return parsePluginDefaultExport(pluginExports.default)
}

/**
 * Finds the most optimal configuration to load without explicit instruction from the user.
 *
 * 1. If the plugin has a `recommended` configuration, it will be returned.
 * 2. If it doesn't, but there is only one configuration available, that one will be returned.
 * 3. If there are multiple configurations, `undefined` will be returned as there is no clear choice.
 */
function findOptimalAutoConfig(pluginConfigs: Configs): Config<Array<Rule>> | undefined {
  if ('recommended' in pluginConfigs) {
    return pluginConfigs.recommended
  }

  const configNames = Object.keys(pluginConfigs)
  if (configNames.length === 1) {
    return pluginConfigs[configNames[0]]
  }

  return undefined
}

if (import.meta.vitest) {
  const { test, expect, describe, vi, beforeEach } = import.meta.vitest
  const { vol } = await import('memfs')
  const { joinFromRoot } = await import('@steiger/toolkit/test')

  vi.mock('node:fs/promises', () => import('memfs').then((memfs) => memfs.fs.promises))

  describe('extractAllDependencies', () => {
    const root = joinFromRoot('home', 'project')
    const packageJsonPath = join(root, 'package.json')

    beforeEach(() => {
      vol.reset()
      vi.spyOn(process, 'cwd').mockReturnValue(root)
    })

    test('returns an empty array when package.json is empty', async () => {
      vol.fromNestedJSON(
        {
          'package.json': '{}',
        },
        root,
      )

      await expect(extractAllDependencies(packageJsonPath)).resolves.toEqual([])
    })

    test('returns an empty array when package.json has no dependencies', async () => {
      vol.fromNestedJSON(
        {
          'package.json': JSON.stringify({ dependencies: {}, devDependencies: {} }),
        },
        root,
      )

      await expect(extractAllDependencies(packageJsonPath)).resolves.toEqual([])
    })

    test('returns both dependencies and devDependencies', async () => {
      vol.fromNestedJSON(
        {
          'package.json': JSON.stringify({
            dependencies: { react: '^17.0.2' },
            devDependencies: { jest: '^26.6.0' },
          }),
        },
        root,
      )

      await expect(extractAllDependencies(packageJsonPath)).resolves.toEqual(['react', 'jest'])
    })
  })

  describe('findOptimalAutoConfig', async () => {
    const rightConfig: Config<Array<Rule>> = []
    const wrongConfig: Config<Array<Rule>> = []

    test('returns nothing when there are no configs', () => {
      expect(findOptimalAutoConfig({})).toBe(undefined)
    })

    test('returns the recommended config when it exists', () => {
      expect(findOptimalAutoConfig({ recommended: rightConfig })).toBe(rightConfig)
      expect(findOptimalAutoConfig({ recommended: rightConfig, other: wrongConfig })).toBe(rightConfig)
    })

    test('returns the only config when there is no recommended config', () => {
      expect(findOptimalAutoConfig({ other: rightConfig })).toBe(rightConfig)
    })

    test('returns nothing when there are multiple configs', () => {
      expect(findOptimalAutoConfig({ other: wrongConfig, other2: wrongConfig })).toBe(undefined)
    })
  })
}
