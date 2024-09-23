import path from 'node:path'

import { File, Folder } from '@steiger/types'
import { pipe } from 'ramda'

import { GlobGroup } from '../../models/config'
import { createFilterAccordingToGlobs } from '../../shared/globs'
import { copyFsEntity } from '../../shared/file-system'
import { SeverityMarkedFile, SeverityMarkedFolder } from './types'

// Converts globs like 'src/shared' to 'src/shared/*' to try to apply to all files that are direct children of 'src/shared'
function convertToSingleFolderCase(globGroup: GlobGroup): GlobGroup {
  function isSingleFolderGlob(part: string) {
    return !part.includes('.') && !part.includes('*')
  }

  function mapToSpecialCase(glob: string) {
    const globParts = glob.split(path.posix.sep)
    const lastPart = globParts[globParts.length - 1]

    if (isSingleFolderGlob(lastPart)) {
      return [...globParts.slice(0, -1), lastPart, '*'].join(path.posix.sep)
    }

    return glob
  }

  return {
    ...globGroup,
    files: globGroup.files.map(mapToSpecialCase),
    ignores: globGroup.ignores.map(mapToSpecialCase),
  }
}

export default function markFileSeverities(globs: Array<GlobGroup>, vfs: SeverityMarkedFolder): SeverityMarkedFolder {
  const vfsCopy = copyFsEntity(vfs, true)

  const fileMarkingPipeline = pipe((fsEntity) =>
    fsEntity.type === 'folder' || fsEntity.severity === 'excluded'
      ? fsEntity
      : globs.reduce((acc, { severity, files, ignores }) => {
          const isApplied = createFilterAccordingToGlobs({ inclusions: files, exclusions: ignores })
          let severityApplies = isApplied(acc.path)

          // Special case for single folder globs like 'src/shared' that should apply to all files
          // that are direct children of 'src/shared'
          if (!severityApplies && fsEntity.type === 'file') {
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
        }, fsEntity),
  )

  function walk(node: Folder | File): Folder | SeverityMarkedFile {
    if (node.type === 'folder') {
      return {
        ...node,
        children: node.children.map(walk),
      }
    }

    return fileMarkingPipeline(node)
  }

  return <SeverityMarkedFolder>walk(vfsCopy)
}
