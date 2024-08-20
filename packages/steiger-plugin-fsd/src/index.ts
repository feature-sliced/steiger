import { enableAllRules, type Config, type ConfigObjectOf, type Plugin } from '@steiger/toolkit'

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
import publicApi from './public-api/index.js'
import repetitiveNaming from './repetitive-naming/index.js'
import segmentsByPurpose from './segments-by-purpose/index.js'
import sharedLibGrouping from './shared-lib-grouping/index.js'
import noProcesses from './no-processes/index.js'
import packageJson from '../package.json'

const plugin = {
  meta: {
    name: 'steiger-plugin-fsd',
    version: packageJson.version,
  },
  ruleDefinitions: [
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
    publicApi,
    repetitiveNaming,
    segmentsByPurpose,
    sharedLibGrouping,
    noProcesses,
  ],
} satisfies Plugin

// export const anotherPlugin = createPlugin({
//   meta: {
//     name: 'steiger-plugin-hello',
//     version: '0.0.0'
//   },
//   ruleDefinitions: [
//     {
//       name: 'hello/test',
//       check(root, options: { foo: string }) {
//         console.log(options.foo)
//         return { diagnostics: [] }
//       }
//     }
//   ]
// })

const configs = {
  recommended: enableAllRules(plugin),
} satisfies Record<string, Config>

export default {
  plugin,
  configs,
}

export type FSDConfigObject = ConfigObjectOf<typeof plugin>
