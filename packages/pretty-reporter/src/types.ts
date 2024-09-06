import type { Diagnostic, Severity } from '@steiger/types'

export interface FullDiagnostic extends Diagnostic {
  ruleName: string
  severity: Exclude<Severity, 'off'>
  ruleDescriptionUrl: string
}
