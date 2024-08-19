import { Severity, File, Folder } from '@steiger/types'

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
  // TODO: Replace with RuleOptions once the corresponding PR is merged
  options: Record<string, unknown>
  globGroups: Array<GlobGroup>
}
