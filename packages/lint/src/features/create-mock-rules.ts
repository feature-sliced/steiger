import { insignificantSlice } from 'fsd-rules'

import { Rule, rules } from '../models/business/rules'

const mockRules: Array<Rule> = [insignificantSlice]

export const createMockRules = () => {
  mockRules.forEach(rule => rules.create(rule))
}
