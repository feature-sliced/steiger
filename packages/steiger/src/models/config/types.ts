import { Severity, BaseRuleOptions } from '@steiger/types'

export interface GlobGroup {
  severity: Severity
  files: Array<string>
  ignores: Array<string>
}

export interface RuleInstructions {
  options: BaseRuleOptions | null
  globGroups: Array<GlobGroup>
}
