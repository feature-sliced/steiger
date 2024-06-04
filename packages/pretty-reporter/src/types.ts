import type { Diagnostic } from 'fsd-rules';

export interface AugmentedDiagnostic extends Diagnostic {
  ruleName: string;
}
