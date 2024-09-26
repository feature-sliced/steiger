import { File, Folder, Severity } from '@steiger/types'

export interface SeverityMarkedFile extends File {
  severity: Severity
}

export interface SeverityMarkedFolder extends Folder {
  children: Array<SeverityMarkedFolder | SeverityMarkedFile>
}
