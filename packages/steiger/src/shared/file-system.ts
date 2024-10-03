import { File, Folder } from '@steiger/types'

export function isPathInTree(vfs: Folder, paths: string | Array<string>) {
  const pathsToCheck = Array.isArray(paths) ? paths : [paths]
  const results: Array<boolean> = new Array(pathsToCheck.length).fill(false)
  let found = 0

  const stack: Array<File | Folder> = [vfs]

  while (stack.length > 0) {
    const node = stack.pop()!
    const currentPathIndex = pathsToCheck.indexOf(node.path)

    if (currentPathIndex !== -1) {
      results[currentPathIndex] = true
      found++
    }

    if (found === pathsToCheck.length) {
      break
    }

    if (node.type === 'folder') {
      for (let i = 0; i < node.children.length; i++) {
        stack.push(node.children[i])
      }
    }
  }

  return typeof paths === 'string' ? results[0] : results
}
