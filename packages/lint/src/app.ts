import {
  ambiguousSliceNames,
  excessiveSlicing,
  forbiddenImports,
  inconsistentNaming,
  insignificantSlice,
  noLayerPublicApi,
  noPublicApiSidestep,
  noReservedFolderNames,
  noSegmentlessSlices,
  publicApi,
  repetitiveNaming,
  segmentsByPurpose,
  sharedLibGrouping,
} from 'fsd-rules'

export type { Rule, RuleResult } from './models/business/rules'
export type { Diagnostic } from 'fsd-rules'
export type { Config } from './models/infractructure/config'

import { watcher } from './features/transfer-fs-to-vfs'
import type { AugmentedDiagnostic } from 'pretty-reporter'

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
  publicApi,
  repetitiveNaming,
  segmentsByPurpose,
  sharedLibGrouping,
]

export function createLinter(_config: any) {
  return {
    run: async (path: string) => {
      const vfs = await watcher.scan(path)

      const ruleResults = await Promise.all(
        rules.map((rule) =>
          Promise.resolve(rule.check(vfs, { sourceFileExtension: 'js' })).then(({ diagnostics }) =>
            diagnostics.map((d) => ({ ...d, ruleName: rule.name }) as AugmentedDiagnostic),
          ),
        ),
      )
      return ruleResults.flat()
    },
    watch: (path: string) => {
      // TODO
    },
  }
}
