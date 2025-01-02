import { trimDiagnosticsToMeetQuota } from './diagnostic-quota'
import { Diagnostic } from '@steiger/types'

const DEFAULT_QUOTA = 20

export const collapseDiagnostics = (diagnosticPerRule: Array<Array<Diagnostic>>) =>
  trimDiagnosticsToMeetQuota(diagnosticPerRule, DEFAULT_QUOTA)
