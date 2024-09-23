import { SeverityMarkedFile, SeverityMarkedFolder } from './types'

export default function removeOffNodes(vfs: SeverityMarkedFolder): SeverityMarkedFolder | null {
  function walk(node: SeverityMarkedFolder | SeverityMarkedFile): SeverityMarkedFolder | SeverityMarkedFile | null {
    if (node.severity === 'off') {
      return null
    }

    if (node.type === 'folder') {
      const remainingChildren = (node.children as Array<SeverityMarkedFolder | SeverityMarkedFile>)
        .map(walk)
        .filter(Boolean)
      return {
        ...node,
        children: remainingChildren,
      }
    }

    return node
  }

  return <SeverityMarkedFolder | null>walk(vfs)
}
