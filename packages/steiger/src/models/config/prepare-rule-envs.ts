import { RuleInstructions } from './types'
import getRuleRunEnvironments from './get-rule-run-environments'
import createVfsForRules from './create-vfs-for-rules'
import markSeverities from './mark-severities'
import { Folder } from '@steiger/types'

export default function prepareRuleEnvs(ruleInstructions: Record<string, RuleInstructions>, vfs: Folder) {
  const ruleToVfs = createVfsForRules(Object.keys(ruleInstructions), vfs)
  const ruleToMarkedVfs = markSeverities(ruleInstructions, ruleToVfs)

  return getRuleRunEnvironments(ruleToMarkedVfs, ruleInstructions, vfs)
}
