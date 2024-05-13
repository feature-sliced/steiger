import { sample } from 'effector'

import { FsUnit, fsUnits } from '../models/fs-units'
import { Term, terms } from '../models/terms'
import { Rule, rules } from '../models/rules'
import { Warning, warnings } from '../models/warnings'

sample({
  clock: [fsUnits.list, rules.store, terms.store],
  fn: (clock) => {
    const [fsUnits, rules, terms] = clock as unknown as [Array<FsUnit>, Array<Rule>, Array<Term>]
    let warningsResult: Array<Warning> = []

    rules.forEach(rule => {
      const warningsForRule = rule.fn(fsUnits)
      if (warningsForRule) {
        if (Array.isArray(warningsForRule)) warningsResult.push(...warningsForRule)
        else warningsResult.push(warningsForRule)
      }
    })

    return warningsResult
  },
  target: warnings.store,
})
