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
} from 'fsd-rules'

import { Rule, rules } from '../models/business/rules'

const mockRules: Array<Rule> = [
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
]

export const createMockRules = () => {
  mockRules.forEach((rule) => rules.create(rule))
}
