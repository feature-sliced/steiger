import type { Diagnostic } from '@feature-sliced/steiger-plugin'

export interface AugmentedDiagnostic extends Diagnostic {
  ruleName: string
}
