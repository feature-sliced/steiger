import { Folder, Severity } from '@steiger/types'

import { GlobGroup } from '../config'
import markFileSeverities from './mark-file-severities'
import { SeverityMarkedFile, SeverityMarkedFolder } from './types'
import calculateFolderSeverity from './calculate-folder-severity'
import toPlainVfs from './to-plain-vfs'

function getWithoutOff(vfs: Folder, globGroups: Array<GlobGroup>) {
  const severityMarkedVfs = markFileSeverities(globGroups, vfs)

  function removeOffFiles(node: SeverityMarkedFolder): SeverityMarkedFolder {
    const children = node.children
      .map((node) => (node.type === 'folder' ? node : node.severity !== 'off'))
      .filter(Boolean) as Array<SeverityMarkedFolder>
    return { ...node, children }
  }

  return removeOffFiles(severityMarkedVfs)
}

// It's a wrapper around getWithoutOff to bring the result to the plain VFS format
// because severity-marked VFS is an internal format for this module and should not leak outside
export function getVfsWithoutOffNodes(vfs: Folder, globGroups: Array<GlobGroup>) {
  return toPlainVfs(getWithoutOff(vfs, globGroups))
}

export function calculateSeveritiesForPaths(vfs: Folder, globGroups: Array<GlobGroup>, paths: Array<string>) {
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
