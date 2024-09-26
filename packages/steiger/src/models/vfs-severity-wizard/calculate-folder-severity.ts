import { Folder, Severity } from '@steiger/types'

import { SeverityMarkedFile, SeverityMarkedFolder } from './types'
import { SeverityHierarchy } from '../../shared/severity'

function highestSeverity(severities: Array<Severity | null>) {
  return severities.reduce((acc: Severity | null, nextSeverity) => {
    if (!acc) {
      return nextSeverity
    }

    if (!nextSeverity) {
      return acc
    }

    return SeverityHierarchy[acc] > SeverityHierarchy[nextSeverity] ? acc : nextSeverity
  }, null)
}

export default function calculateFolderSeverity(node: Folder): Severity | null {
  const childrenSeverities = (node.children as Array<SeverityMarkedFolder | SeverityMarkedFile>).map((child) =>
    child.type === 'file' ? child.severity : calculateFolderSeverity(child),
  )
  return highestSeverity(childrenSeverities)
}
