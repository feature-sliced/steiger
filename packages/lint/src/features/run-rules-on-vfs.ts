import { combine, sample } from 'effector'
import { debounce } from 'patronum'

import { rules } from '../models/business/rules'
import { Diagnostic, diagnostics } from '../models/business/diagnostics'
import type { createVfsRoot } from "../models/business/vfs"
import { config } from '../models/infractructure/config'

export const runRulesOnVfs = (vfs: ReturnType<typeof createVfsRoot>) => {
  const dataDebounced = debounce(combine({
    vfs: vfs.$tree,
    rules: rules.store,
    config: config.store,
  }), 1000)

  sample({
    clock: dataDebounced,
    source: dataDebounced,
    fn: (source) => {
      const { vfs, rules, config } = source
      let diagnosticsResult: Array<Diagnostic> = []

      if (!config) throw Error('config not initialized')

      rules.forEach((rule) => {
        const ruleResult = rule.check(vfs, { sourceFileExtension: config.typescript ? 'ts' : 'js', include: [] })
        console.log('rule.name', rule.name)
        if ('finally' in ruleResult) {
          ruleResult.then((r) => {
            // diagnosticsResult.push(...r.diagnostics)
            console.log('ruleResult (async)', rule.name, r)
          })
        } else {
          diagnosticsResult.push(...ruleResult.diagnostics)
          console.log('ruleResult', ruleResult)
        }
      })

      return diagnosticsResult
    },
    target: diagnostics.store,
  })
}
