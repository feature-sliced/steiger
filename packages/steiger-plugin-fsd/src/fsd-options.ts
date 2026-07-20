import type { LayerAliases, LayerConvention } from '@feature-sliced/filesystem'
import { basename } from 'node:path'
import { getLayers, type Folder, type LayerName } from '@feature-sliced/filesystem'
import type { Rule } from '@steiger/toolkit'

export type FsdPluginOptions = {
  /**
   * Treat project-specific top-level folders as canonical FSD layers.
   *
   * @example
   * ```ts
   * createFsdPlugin({ layerAliases: { pages: 'screens' } })
   * ```
   */
  layerAliases?: LayerAliases
}

export type FsdRuleOptions = {
  layerConvention?: LayerConvention
}

export function createLayerConvention(options: FsdPluginOptions): LayerConvention | undefined {
  if (!options.layerAliases || Object.keys(options.layerAliases).length === 0) {
    return undefined
  }

  return {
    layerAliases: options.layerAliases,
  }
}

export function withFsdOptions<Context, Options extends Record<string, unknown>, Name extends string>(
  rule: Rule<Context, Options, Name>,
  ruleOptions: FsdRuleOptions,
): Rule<Context, Options & FsdRuleOptions, Name> {
  return {
    ...rule,
    check(this: Context, root, options) {
      return rule.check.call(this, root, {
        ...options,
        ...ruleOptions,
      } as Options)
    },
  }
}

export type { LayerAliases, LayerConvention }

export function getLayerDisplayName(root: Folder, layerName: LayerName, layerConvention?: LayerConvention): string {
  return basename(getLayers(root, layerConvention)[layerName]?.path ?? layerName)
}

export function getLayerPath(root: Folder, layerName: LayerName, layerConvention?: LayerConvention): string {
  return getLayers(root, layerConvention)[layerName]?.path ?? `${root.path}/${layerName}`
}
