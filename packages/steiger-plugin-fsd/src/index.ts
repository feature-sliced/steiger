import { parse } from 'node:path'
import { crossReferenceToken } from '@feature-sliced/filesystem'
import {
  createConfigs,
  createPlugin,
  enableSpecificRules,
  type BaseRuleOptions,
  type ConfigObjectOf,
  type Folder,
  type Rule,
  type RuleResult,
} from '@steiger/toolkit'
import type { FSDPluginOptions } from './_lib/plugin-options.js'
import ambiguousSliceNames from './ambiguous-slice-names/index.js'
import excessiveSlicing from './excessive-slicing/index.js'
import forbiddenImports from './forbidden-imports/index.js'
import inconsistentNaming from './inconsistent-naming/index.js'
import insignificantSlice from './insignificant-slice/index.js'
import noLayerPublicApi from './no-layer-public-api/index.js'
import noPublicApiSidestep from './no-public-api-sidestep/index.js'
import noReservedFolderNames from './no-reserved-folder-names/index.js'
import noSegmentlessSlices from './no-segmentless-slices/index.js'
import noSegmentsOnSlicedLayers from './no-segments-on-sliced-layers/index.js'
import noUiInApp from './no-ui-in-app/index.js'
import publicApi from './public-api/index.js'
import repetitiveNaming from './repetitive-naming/index.js'
import segmentsByPurpose from './segments-by-purpose/index.js'
import sharedLibGrouping from './shared-lib-grouping/index.js'
import typoInLayerName from './typo-in-layer-name/index.js'
import noProcesses from './no-processes/index.js'
import packageJson from '../package.json' with { type: 'json' }
import noCrossImports from './no-cross-imports/index.js'
import noHigherLevelImports from './no-higher-level-imports/index.js'
import importLocality from './import-locality/index.js'
import noWildcardExports from './no-wildcard-exports/index.js'

const enabledRules = [
  ambiguousSliceNames,
  excessiveSlicing,
  forbiddenImports,
  inconsistentNaming,
  insignificantSlice,
  noLayerPublicApi,
  noPublicApiSidestep,
  noReservedFolderNames,
  noSegmentlessSlices,
  noSegmentsOnSlicedLayers,
  noUiInApp,
  publicApi,
  repetitiveNaming,
  segmentsByPurpose,
  sharedLibGrouping,
  typoInLayerName,
  noProcesses,
]
const disabledRules = [noCrossImports, noHigherLevelImports, importLocality, noWildcardExports]

const rules = [...enabledRules, ...disabledRules]

export type { FSDPluginOptions }

type SegmentAwareRule<Name extends string> = {
  name: Name
  check(root: Folder, ruleOptions: BaseRuleOptions, pluginOptions?: FSDPluginOptions): RuleResult | Promise<RuleResult>
}

/** Binds the plugin options to a rule, since Steiger itself only calls `check(root, ruleOptions)`. */
function configureRule<Name extends string>(rule: SegmentAwareRule<Name>, pluginOptions: FSDPluginOptions) {
  return {
    ...rule,
    check(root, ruleOptions) {
      return rule.check(root, ruleOptions, pluginOptions)
    },
  } satisfies Rule<unknown, BaseRuleOptions, Name>
}

function validateSegmentNames(additionalSegments: unknown): Array<string> {
  if (!Array.isArray(additionalSegments)) {
    throw new TypeError('additionalSegments must be an array of names.')
  }

  const segmentNames = new Set<string>()
  for (const name of additionalSegments) {
    if (
      typeof name !== 'string' ||
      name.trim() === '' ||
      name === '.' ||
      name === '..' ||
      /[/\\]/.test(name) ||
      parse(name).name !== name ||
      name === 'index' ||
      name === crossReferenceToken
    ) {
      throw new TypeError(`Invalid additional segment name: ${String(name)}.`)
    }
    segmentNames.add(name)
  }
  return Array.from(segmentNames)
}

export function createFsdPlugin(options: FSDPluginOptions = {}) {
  const additionalSegments = validateSegmentNames(options.additionalSegments ?? [])
  const pluginOptions: FSDPluginOptions = { additionalSegments }
  const isConfigured = additionalSegments.length > 0

  const plugin = createPlugin({
    meta: {
      name: '@feature-sliced/steiger-plugin',
      version: packageJson.version,
    },
    ruleDefinitions: isConfigured ? rules.map((rule) => configureRule(rule, pluginOptions)) : rules,
  })

  const configs = createConfigs({
    recommended: enableSpecificRules(plugin, enabledRules),
  })

  return { plugin, configs }
}

const fsd = createFsdPlugin()

export default fsd

export type FSDConfigObject = ConfigObjectOf<typeof fsd.plugin>
