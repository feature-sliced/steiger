import type { Diagnostic, Severity } from '@steiger/types'

export interface AugmentedDiagnostic extends Diagnostic {
  ruleName: string
  severity: Exclude<Severity, 'off'>
  getRuleDescriptionUrl(ruleName: string): URL
}
