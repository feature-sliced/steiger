import { Config, Rule, Plugin, ConfigObject } from '@steiger/types'

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
import noProcesses from './no-processes/index.js'
import packageJson from '../package.json'

const allRules: Array<Rule> = [
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
  noProcesses,
]

const allRulesEnabledConfig: ConfigObject = {
  rules: allRules.reduce((acc, rule) => ({ ...acc, [rule.name]: 'error' }), {}),
}

const plugin: Plugin = {
  meta: {
    name: 'steiger-plugin-fsd',
    version: packageJson.version,
  },
  ruleDefinitions: allRules,
}

const configs: Record<string, Config> = {
  recommended: [plugin, allRulesEnabledConfig],
}

export default {
  plugin,
  configs,
}
