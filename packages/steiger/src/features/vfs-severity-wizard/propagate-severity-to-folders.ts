import { Severity } from '@steiger/types'

import { SeverityMarkedFile, SeverityMarkedFolder } from './types'
import { SeverityHierarchy } from '../../shared/severity'

function calculateHighestSeverity(nodes: Array<SeverityMarkedFolder | SeverityMarkedFile>, countChildFolders: boolean) {
  return nodes
    .filter((node) => countChildFolders || node.type === 'file')
    .reduce((acc: Severity | null, node) => {
      if (!acc) {
        return node.severity
      }

      return SeverityHierarchy[acc] > SeverityHierarchy[node.severity] ? acc : node.severity
    }, null)
}

export default function propagateSeverityToFolders(
  vfs: SeverityMarkedFolder,
  countChildFolders: boolean = true,
): SeverityMarkedFolder {
  function walk(node: SeverityMarkedFolder | SeverityMarkedFile): SeverityMarkedFolder | SeverityMarkedFile {
    if (node.type === 'folder') {
      const children = (node.children as Array<SeverityMarkedFolder | SeverityMarkedFile>).map(walk)
      const severity = calculateHighestSeverity(children, countChildFolders)

      if (!severity) {
        return {
          ...node,
          children,
        }
      }

      return {
        ...node,
        children,
        severity,
      }
    }

    return node
  }

  return <SeverityMarkedFolder>walk(vfs)
}
