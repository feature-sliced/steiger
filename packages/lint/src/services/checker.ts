import { sample } from 'effector'
import { FsdRoot } from '@feature-sliced/filesystem'

import { fsUnits } from '../models/fs-units'
import { Rule, rules } from '../models/rules'
import { Diagnostic, diagnostics } from '../models/diagnostics'
import { ConfigInternal } from '../shared/config'

export const createChecker = (config: ConfigInternal) => {
  sample({
    clock: [fsUnits.tree, rules.store],
    fn: (clock) => {
      const [fsUnits, rules] = clock as unknown as [FsdRoot, Array<Rule>]
      let diagnosticsResult: Array<Diagnostic> = []

      rules.forEach(rule => {
        const ruleResult = rule.check(fsUnits, { sourceFileExtension: config.typescript ? 'ts' : 'js' })
        if ('finally' in ruleResult) {
          ruleResult.then(r => diagnosticsResult.push(...r.diagnostics))
        } else {
          diagnosticsResult.push(...ruleResult.diagnostics)
        }
      })

      return diagnosticsResult
    },
    target: diagnostics.store,
  })

  return {
    close: () => {}
  }
}
