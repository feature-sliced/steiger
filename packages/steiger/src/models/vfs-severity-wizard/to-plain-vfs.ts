import { SeverityMarkedFile, SeverityMarkedFolder } from './types'
import { Folder, File } from '@steiger/types'

export default function toPlainVfs(vfs: SeverityMarkedFolder): Folder {
  function walk(node: SeverityMarkedFolder | SeverityMarkedFile): Folder | File {
    return node.type === 'folder'
      ? {
          ...node,
          children: (node.children as Array<SeverityMarkedFolder | SeverityMarkedFile>).map(walk),
        }
      : {
          type: node.type,
          path: node.path,
        }
  }

  return <Folder>walk(vfs)
}
