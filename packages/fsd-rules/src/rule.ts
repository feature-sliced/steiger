import type { FsdRoot } from '@feature-sliced/filesystem'

export interface Rule {
  /** Short code name for the rule. */
  name: string
  check: (root: FsdRoot) => RuleResult
}

export type RuleResult = { errors: Array<string> }
