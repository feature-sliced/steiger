import { enableAllRules, type ConfigObjectOf, createPlugin, createConfigs } from '@steiger/toolkit'

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
import packageJson from '../package.json'

const rules = [
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

const plugin = createPlugin({
  meta: {
    name: 'steiger-plugin-fsd',
    version: packageJson.version,
  },
  ruleDefinitions: rules,
})

const configs = createConfigs({
  recommended: enableAllRules(plugin),
})

export default {
  plugin,
  configs,
}

export type FSDConfigObject = ConfigObjectOf<typeof plugin>
