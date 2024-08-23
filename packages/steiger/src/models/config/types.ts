import { Severity, File, Folder, BaseRuleOptions } from '@steiger/types'

export interface RuleRunEnvironment {
  severityMap: Record<string, Severity>
  vfs: Folder | null
  ruleOptions: BaseRuleOptions
}

export interface SeverityMarkedFile extends File {
  severity: Severity
}

export interface SeverityMarkedFolder extends Folder {
  severity: Severity
}

interface GlobGroup {
  severity: Severity
  files: Array<string>
  ignores: Array<string>
}

export interface RuleInstructions {
  options: BaseRuleOptions | null
  globGroups: Array<GlobGroup>
}
