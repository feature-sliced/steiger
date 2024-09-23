import { Folder, Rule } from '@steiger/types'

import { getRuleOptions } from '../../models/config'

export async function runRule(vfs: Folder | null, rule: Rule) {
  if (!vfs) {
    return Promise.resolve({ diagnostics: [] })
  }

  return Promise.resolve(rule.check(vfs, getRuleOptions(rule.name) || undefined))
}
