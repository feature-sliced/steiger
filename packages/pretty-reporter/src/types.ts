import type { Diagnostic } from '@steiger/types'

export interface AugmentedDiagnostic extends Diagnostic {
  ruleName: string
}
