import { sample } from 'effector'
import { FsdRoot } from '@feature-sliced/filesystem'

import { Rule, rules } from '../models/business/rules'
import { Diagnostic, diagnostics } from '../models/business/diagnostics'
import { vfs } from '../models/business/vfs'
import { Config, config } from '../models/infractructure/config'

sample({
  clock: [vfs.tree, rules.store, config.store],
  fn: (clock) => {
    const [fsUnits, rules, config] = clock as unknown as [FsdRoot, Array<Rule>, Config]
    let diagnosticsResult: Array<Diagnostic> = []

    rules.forEach((rule) => {
      const ruleResult = rule.check(fsUnits, { sourceFileExtension: config.typescript ? 'ts' : 'js', include: [] })
      if ('finally' in ruleResult) {
        ruleResult.then((r) => diagnosticsResult.push(...r.diagnostics))
      } else {
        diagnosticsResult.push(...ruleResult.diagnostics)
      }
    })

    return diagnosticsResult
  },
  target: diagnostics.store,
})
