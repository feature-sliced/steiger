import { Folder, Rule } from '@steiger/types'

import { getGlobsForRule, getRuleOptions, type ProcessedConfig } from '../../models/config'
import { prepareVfsForRuleRun } from './prepare-vfs-for-rule-run'

export async function runRule(config: ProcessedConfig, vfs: Folder, rule: Rule) {
  const globsForRule = getGlobsForRule(config, rule.name)

  const finalVfs = prepareVfsForRuleRun(vfs, globsForRule)

  if (!finalVfs) {
    return Promise.resolve({ diagnostics: [] })
  }

  return Promise.resolve(rule.check(finalVfs, getRuleOptions(config, rule.name) ?? {}))
}
