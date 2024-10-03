import { Folder, Severity } from '@steiger/types'

import { GlobGroupWithSeverity } from '../config'
import markFileSeverities from './mark-file-severities'
import { SeverityMarkedFile, SeverityMarkedFolder } from './types'
import calculateFolderSeverity from './calculate-folder-severity'
import toPlainVfs from './to-plain-vfs'
import { removeEmptyFolders } from '../../shared/file-system'

function removeOffFiles(node: SeverityMarkedFolder): SeverityMarkedFolder {
  const children = node.children
    .map((node) => (node.type === 'folder' ? removeOffFiles(node) : node))
    .filter((node) => (node.type === 'folder' ? true : node.severity !== 'off'))
  return { ...node, children }
}

function getWithoutOff(vfs: Folder, globGroups: Array<GlobGroupWithSeverity>) {
  const severityMarkedVfs = markFileSeverities(globGroups, vfs)

  return removeOffFiles(severityMarkedVfs)
}

// It's a wrapper around getWithoutOff to bring the result to the plain VFS format
// because severity-marked VFS is an internal format for this module and should not leak outside
export function getVfsWithoutOffNodes(vfs: Folder, globGroups: Array<GlobGroupWithSeverity>) {
  return removeEmptyFolders(toPlainVfs(getWithoutOff(vfs, globGroups)))
}

export function calculateSeveritiesForPaths(
  vfs: Folder,
  globGroups: Array<GlobGroupWithSeverity>,
  paths: Array<string>,
) {
  const vfsWithoutOff = getWithoutOff(vfs, globGroups)

  const severities: Array<Severity | null> = new Array(paths.length).fill(null)
  let found = 0

  const stack: Array<SeverityMarkedFile | SeverityMarkedFolder> = [vfsWithoutOff]

  while (stack.length > 0) {
    const node = stack.pop()!
    const currentPathIndex = paths.indexOf(node.path)

    if (currentPathIndex !== -1) {
      severities[currentPathIndex] = node.type === 'folder' ? calculateFolderSeverity(node) : node.severity
      found++
    }

    if (found === paths.length) {
      break
    }

    if (node.type === 'folder') {
      for (let i = 0; i < node.children.length; i++) {
        stack.push((node.children as Array<SeverityMarkedFolder | SeverityMarkedFile>)[i])
      }
    }
  }

  return severities
}
