import { Folder, Rule } from '@steiger/types'
import { getGlobsForRule, getRuleOptions } from '../../models/config'
import removeOffVfs from '../remove-off-vfs'

export async function runRule(vfs: Folder, rule: Rule) {
  const optionsForCurrentRule = getRuleOptions(rule.name)
  const globsForRule = getGlobsForRule(rule.name)

  if (!globsForRule) {
    throw new Error(`Severity settings for rule ${rule.name} are not found but rule is enabled`)
  }

  const finalVfs = removeOffVfs(globsForRule, vfs)

  if (!finalVfs) {
    return Promise.resolve({ diagnostics: [] })
  }

  return Promise.resolve(rule.check(finalVfs, optionsForCurrentRule || undefined))
}
