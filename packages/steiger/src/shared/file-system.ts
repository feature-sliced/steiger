import { File, Folder } from '@steiger/types'

/**
 * Turn a tree folder structure into a flat array of files.
 * */
export function flattenFolder(folder: Folder): File[] {
  return folder.children.reduce((acc, child) => {
    if (child.type === 'file') {
      return [...acc, child]
    }

    return [...acc, ...flattenFolder(child)]
  }, [] as File[])
}

export function copyFsEntity<T extends Folder | File>(fsEntity: T, deep: boolean = false) {
  if (fsEntity.type === 'folder') {
    const newChildren: Array<Folder | File> = deep
      ? fsEntity.children.map((child) => (child.type === 'folder' ? copyFsEntity(child, true) : child))
      : []

    return {
      ...fsEntity,
      children: newChildren,
    }
  }

  return { ...fsEntity }
}
