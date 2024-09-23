import { posix } from 'node:path'

import { GlobGroup } from '../../models/config'
import { createFilterAccordingToGlobs } from '../../shared/globs'
import { copyFsEntity } from '../../shared/file-system'
import { SeverityMarkedFile, SeverityMarkedFolder } from './types'

// Converts globs like 'src/shared' to 'src/shared/*' to try to apply to all files that are direct children of 'src/shared'
function convertToSingleFolderCase(globGroup: GlobGroup): GlobGroup {
  function isSingleFolderGlob(part: string) {
    return !part.includes('.') && !part.includes('*')
  }

  function mapToSingleFolderCase(glob: string) {
    const globParts = glob.split(posix.sep)
    const lastPart = globParts[globParts.length - 1]

    if (isSingleFolderGlob(lastPart)) {
      return [...globParts.slice(0, -1), lastPart, '*'].join(posix.sep)
    }

    return glob
  }

  return {
    ...globGroup,
    files: globGroup.files.map(mapToSingleFolderCase),
    ignores: globGroup.ignores.map(mapToSingleFolderCase),
  }
}

export default function markFileSeverities(globs: Array<GlobGroup>, vfs: SeverityMarkedFolder): SeverityMarkedFolder {
  const vfsCopy = copyFsEntity(vfs, true)

  function markIfFile(node: SeverityMarkedFolder | SeverityMarkedFile) {
    return node.type === 'folder' || node.severity === 'excluded'
      ? node
      : globs.reduce((acc, { severity, files, ignores }) => {
          const isApplied = createFilterAccordingToGlobs({ inclusions: files, exclusions: ignores })
          let severityApplies = isApplied(acc.path)

          // Special case for single folder globs like 'src/shared' that should apply to all files
          // that are direct children of 'src/shared'
          if (!severityApplies && node.type === 'file') {
            const singleFolderCaseGlobs = convertToSingleFolderCase({ severity, files, ignores })
            const isCaseApplied = createFilterAccordingToGlobs({
              inclusions: singleFolderCaseGlobs.files,
              exclusions: singleFolderCaseGlobs.ignores,
            })

            severityApplies = isCaseApplied(acc.path)
          }

          return severityApplies
            ? {
                ...acc,
                severity,
              }
            : acc
        }, node)
  }

  function walk(node: SeverityMarkedFolder | SeverityMarkedFile): SeverityMarkedFolder | SeverityMarkedFile {
    if (node.type === 'folder') {
      return {
        ...node,
        children: (node.children as Array<SeverityMarkedFolder | SeverityMarkedFile>).map(walk),
      }
    }

    return markIfFile(node)
  }

  return <SeverityMarkedFolder>walk(vfsCopy)
}
