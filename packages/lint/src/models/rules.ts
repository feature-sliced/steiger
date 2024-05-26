import { FsdRoot } from '@feature-sliced/filesystem'

import { createEffectorArray } from '../shared/create-effector-array'

import { Diagnostic } from './diagnostics'

import { Context } from './context'

export interface Rule {
  /** Short code name for the rule. */
  name: string
  check: (root: FsdRoot, context: Context) => RuleResult | Promise<RuleResult>
}

export interface RuleResult {
  diagnostics: Array<Diagnostic>
}

export const rules = createEffectorArray<Rule>([])
