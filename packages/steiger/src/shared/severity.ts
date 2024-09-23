import { PublicSeverity } from '@steiger/types'

export enum SeverityHierarchy {
  excluded = 0,
  off = 1,
  warn = 2,
  error = 3,
}

export type DiagnosticSeverity = Exclude<PublicSeverity, 'off' | 'excluded'>
