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

export interface FSDPluginOptions {
  /** Extra names that can identify a segment when detecting slices. */
  additionalSegmentNames?: ReadonlyArray<string>
}

type SegmentAwareRule<Name extends string> = {
  name: Name
  check(
    root: Folder,
    options: BaseRuleOptions,
    additionalSegmentNames?: Array<string>,
  ): RuleResult | Promise<RuleResult>
}

function configureRule<Name extends string>(rule: SegmentAwareRule<Name>, additionalSegmentNames: Array<string>) {
  return {
    ...rule,
    check(root, options) {
      return rule.check(root, options, additionalSegmentNames)
    },
  } satisfies Rule<unknown, BaseRuleOptions, Name>
}

export function createFsdPlugin({ additionalSegmentNames = [] }: FSDPluginOptions = {}) {
  if (!Array.isArray(additionalSegmentNames)) {
    throw new TypeError('additionalSegmentNames must be an array of names.')
  }

  const segmentNames = new Set<string>()
  for (const name of additionalSegmentNames) {
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
  const names = Array.from(segmentNames)
  const plugin = createPlugin({
    meta: {
      name: '@feature-sliced/steiger-plugin',
      version: packageJson.version,
    },
    ruleDefinitions: names.length === 0 ? rules : rules.map((rule) => configureRule(rule, names)),
  })

  const configs = createConfigs({
    recommended: enableSpecificRules(plugin, enabledRules),
  })

  return { plugin, configs }
}

const fsd = createFsdPlugin()

export default fsd

export type FSDConfigObject = ConfigObjectOf<typeof fsd.plugin>
