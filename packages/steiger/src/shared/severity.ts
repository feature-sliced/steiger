import { Severity } from '@steiger/types'

export enum SeverityHierarchy {
  off = 0,
  warn = 1,
  error = 2,
}

export type DiagnosticSeverity = Exclude<Severity, 'off'>
