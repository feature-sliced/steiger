import { Folder, Rule } from '@steiger/types'
import { getGlobsForRule, getRuleOptions } from '../../models/config'
import calcAndRemoveOffNodes from './calc-and-remove-off-nodes'

export async function runRule(vfs: Folder, rule: Rule) {
  const globsForRule = getGlobsForRule(rule.name)

  if (!globsForRule) {
    throw new Error(`Severity settings for rule ${rule.name} are not found but rule is enabled`)
  }

  const finalVfs = calcAndRemoveOffNodes(globsForRule, vfs)

  if (!finalVfs) {
    return Promise.resolve({ diagnostics: [] })
  }

  return Promise.resolve(rule.check(finalVfs, getRuleOptions(rule.name) || undefined))
}
