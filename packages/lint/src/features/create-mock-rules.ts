import { Rule, rules } from '../models/rules'

const mockRules: Array<Rule> = [{
  name: 'fsd-layers-pages',
  fn: (fsUnits) => {
    console.log('rule is called', fsUnits.length)
    return null
  }
}]

export const createMockRules = () => {
  mockRules.forEach(rule => rules.create(rule))
}
