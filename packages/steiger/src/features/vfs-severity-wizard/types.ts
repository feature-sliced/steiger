import { File, Folder, Severity } from '@steiger/types'

export interface SeverityMarkedFile extends File {
  severity: Severity
}

export interface SeverityMarkedFolder extends Folder {
  severity: Severity
}
