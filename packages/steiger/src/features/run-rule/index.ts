import { Folder, Rule } from '@steiger/types'
import { getGlobsForRule, getRuleOptions } from '../../models/config'
import { prepareVfsForRuleRun } from './prepare-vfs-for-rule-run'

export async function runRule(vfs: Folder, rule: Rule) {
  const globsForRule = getGlobsForRule(rule.name)

  if (!globsForRule) {
    throw new Error(`Glob settings for rule ${rule.name} are not found but rule is enabled`)
  }

  const finalVfs = prepareVfsForRuleRun(vfs, globsForRule)

  if (!finalVfs) {
    return Promise.resolve({ diagnostics: [] })
  }

  return Promise.resolve(rule.check(finalVfs, getRuleOptions(rule.name) || undefined))
}
