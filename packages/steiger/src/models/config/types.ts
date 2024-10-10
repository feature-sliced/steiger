import { Severity, BaseRuleOptions } from '@steiger/types'
import { GlobGroup } from '../../shared/globs'

export interface GlobGroupWithSeverity extends GlobGroup {
  severity: Severity
}

export interface RuleInstructions {
  options: BaseRuleOptions | null
  globGroups: Array<GlobGroupWithSeverity>
}
