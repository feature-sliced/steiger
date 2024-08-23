import { sep } from 'node:path'

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

/**
 * Turns flat array of files and folders into a tree structure based on the paths.
 * */
export function recomposeTree(folder: Folder, nodes: Array<Folder | File>) {
  const folderCopy = copyFsEntity(folder)

  function getEntityBackToTree(folder: Folder, nested: Folder | File) {
    const pathDiff = nested.path.slice(folder.path.length + 1)
    const pathParts = pathDiff.split(sep).filter(Boolean)
    let currentFolder = folder

    for (let i = 0; i < pathParts.length; i++) {
      const pathPart = pathParts[i]
      const isLastPart = i === pathParts.length - 1
      const nextPath = `${currentFolder.path}${sep}${pathPart}`
      const existingFolder = currentFolder.children.find(
        (child) => child.type === 'folder' && child.path === nextPath,
      ) as Folder | undefined

      if (isLastPart && nested.type === 'file') {
        currentFolder.children.push(nested)
        return
      }

      if (existingFolder) {
        currentFolder = existingFolder
      } else {
        const newFolder: Folder = {
          type: 'folder',
          path: nextPath,
          children: [],
        }
        currentFolder.children.push(newFolder)
        currentFolder = newFolder
      }
    }
  }

  nodes.forEach((node) => {
    getEntityBackToTree(folderCopy, node)
  })

  return folderCopy
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
