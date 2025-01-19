import { readFile } from 'node:fs/promises'
import process from 'node:process'
import * as pkg from 'empathic/package'
import { ResolverFactory } from 'oxc-resolver'
import type { Plugin, Config, Rule } from '@steiger/types'

import { parsePackage } from './parse-package'
import { isSteigerPlugin } from './is-steiger-plugin'
import { parsePluginDefaultExport } from './parse-plugin-default-export'

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
    const packageJson = await readFile(packageJsonPath, { encoding: 'utf-8' }).then(JSON.parse).then(parsePackage)

    const pluginNames = Object.keys(packageJson.dependencies ?? {})
      .concat(Object.keys(packageJson.devDependencies ?? {}))
      .filter(isSteigerPlugin)

    return Promise.all(
      pluginNames.map(async (pluginName) => {
        const pluginIndex = await resolve.async(process.cwd(), pluginName)
        if (pluginIndex.path === undefined) {
          throw new Error(`Could not resolve plugin ${pluginName}`)
        }
        const pluginExports = await import(pluginIndex.path)
        const { plugin, configs } = await parsePluginDefaultExport(pluginExports.default)
        let autoConfig: Config<Array<Rule>> | undefined
        if ('recommended' in configs) {
          autoConfig = configs.recommended
        } else {
          const configNames = Object.keys(configs)
          if (configNames.length === 1) {
            autoConfig = configs[configNames[0]]
          }
        }

        return { plugin, autoConfig }
      }),
    )
  } catch {
    return []
  }
}
