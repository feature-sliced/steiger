import { File, Folder } from '@steiger/types'

export function removeEmptyFolders(node: Folder): Folder {
  const children = node.children
    .map((node) => (node.type === 'folder' ? removeEmptyFolders(node) : node))
    .filter((node) => (node.type === 'folder' ? node.children.length > 0 : true))

  return {
    ...node,
    children,
  }
}

export function copyNode<T extends Folder | File>(fsEntity: T, deep: boolean = false) {
  if (fsEntity.type === 'folder') {
    const newChildren: Array<Folder | File> = deep
      ? fsEntity.children.map((child) => (child.type === 'folder' ? copyNode(child, true) : child))
      : []

    return {
      ...fsEntity,
      children: newChildren,
    }
  }

  return { ...fsEntity }
}
