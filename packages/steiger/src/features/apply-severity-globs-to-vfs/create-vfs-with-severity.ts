import { pipe, filter, map } from 'ramda'
import { Folder, File } from '@steiger/types'
import { SeverityMarkedFile, SeverityMarkedFolder } from './types'

import { recomposeTree } from '../../shared/file-system'
import { VfsWithSeverity } from './types'

function isNotOff({ severity }: SeverityMarkedFile | SeverityMarkedFolder) {
  return severity !== 'off'
}

function toPlainFsEntity(entity: SeverityMarkedFile | SeverityMarkedFolder): File | Folder {
  return entity.type === 'folder'
    ? {
        children: entity.children,
        path: entity.path,
        type: entity.type,
      }
    : {
        path: entity.path,
        type: entity.type,
      }
}

export default function createVfsWithSeverity(
  markedVfs: Array<SeverityMarkedFile | SeverityMarkedFolder>,
  root: Folder,
): VfsWithSeverity {
  const processVfs = pipe(filter(isNotOff), map(toPlainFsEntity))

  const severityMap = markedVfs.reduce((acc, { path, severity }) => {
    return {
      ...acc,
      [path]: severity,
    }
  }, {})

  const plainVfs = processVfs(markedVfs)

  return {
    severityMap,
    // If there are no files, we don't need to recompose the tree
    // so, the code that uses this data can see null and skip running the rule
    vfs: plainVfs.length ? recomposeTree(root, plainVfs) : null,
  }
}
