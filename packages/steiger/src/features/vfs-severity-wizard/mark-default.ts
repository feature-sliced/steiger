import { Folder, File } from '@steiger/types'

import { SeverityMarkedFile, SeverityMarkedFolder } from './types'

export default function markDefault(node: Folder | File): SeverityMarkedFolder | SeverityMarkedFile {
  return node.type === 'folder'
    ? {
        ...node,
        children: node.children.map((c) => markDefault(c)),
        severity: 'off',
      }
    : {
        ...node,
        severity: 'off',
      }
}
