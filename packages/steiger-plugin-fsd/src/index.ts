import { enableSpecificRules, type ConfigObjectOf, createPlugin, createConfigs } from '@steiger/toolkit'
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
import { createLayerConvention, type FsdPluginOptions, withFsdOptions } from './fsd-options.js'

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
const disabledRules = [noCrossImports, noHigherLevelImports, importLocality]

export function createFsdPlugin(options: FsdPluginOptions = {}) {
  const ruleOptions = { layerConvention: createLayerConvention(options) }
  const enabledRuleDefinitions = enabledRules.map((rule) => withFsdOptions(rule, ruleOptions))
  const disabledRuleDefinitions = disabledRules.map((rule) => withFsdOptions(rule, ruleOptions))

  const plugin = createPlugin({
    meta: {
      name: '@feature-sliced/steiger-plugin',
      version: packageJson.version,
    },
    ruleDefinitions: [...enabledRuleDefinitions, ...disabledRuleDefinitions],
  })

  const configs = createConfigs({
    recommended: enableSpecificRules(plugin, enabledRuleDefinitions),
  })

  return {
    plugin,
    configs,
  }
}

export default createFsdPlugin()

export type FSDConfigObject = ConfigObjectOf<ReturnType<typeof createFsdPlugin>['plugin']>
export type { FsdPluginOptions, LayerAliases } from './fsd-options.js'
