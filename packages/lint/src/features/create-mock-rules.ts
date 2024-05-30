import { insignificantSlice, ambiguousSliceNames, excessiveSlicing, forbiddenImports } from 'fsd-rules'

import { Rule, rules } from '../models/business/rules'

const mockRules: Array<Rule> = [insignificantSlice, ambiguousSliceNames, excessiveSlicing, forbiddenImports]

export const createMockRules = () => {
  mockRules.forEach(rule => rules.create(rule))
}
