import { sample } from 'effector'

import { Rule, rules } from '../models/business/rules'
import { Diagnostic, diagnostics } from '../models/business/diagnostics'
import { vfs } from '../models/business/vfs'
import { Config, config } from '../models/infractructure/config'

export const runRulesOnVfs = () => {
  sample({
    clock: [vfs.tree, rules.store, config.store],
    source: {
      vfs: vfs.tree,
      rules: rules.store,
      config: config.store,
    },
    fn: (source) => {
      const { vfs, rules, config } = source
      let diagnosticsResult: Array<Diagnostic> = []

      if (!config) throw Error('config not initialized')

      rules.forEach((rule) => {
        const ruleResult = rule.check(vfs, { sourceFileExtension: config.typescript ? 'ts' : 'js', include: [] })
        console.log('rule.name', rule.name)
        console.log('ruleResult', ruleResult)
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
}
