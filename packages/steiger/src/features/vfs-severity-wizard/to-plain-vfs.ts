import { Folder, File } from '@steiger/types'

import { SeverityMarkedFile, SeverityMarkedFolder } from './types'

export default function toPlainVfs(vfs: SeverityMarkedFolder): Folder {
  function walk(node: SeverityMarkedFolder | SeverityMarkedFile): Folder | File {
    return node.type === 'folder'
      ? {
          children: (node.children as Array<SeverityMarkedFolder | SeverityMarkedFile>).map(walk),
          path: node.path,
          type: node.type,
        }
      : {
          path: node.path,
          type: node.type,
        }
  }

  return <Folder>walk(vfs)
}
