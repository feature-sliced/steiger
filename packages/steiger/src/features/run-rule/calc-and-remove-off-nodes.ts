import { File, Folder } from '@steiger/types'
import { filter, map, pipe } from 'ramda'

import markSeverities from '../run-rule/mark-severities'
import { GlobGroup } from '../../models/config'
import { copyFsEntity, flattenFolder, recomposeTree } from '../../shared/file-system'
import { SeverityMarkedFile, SeverityMarkedFolder } from './types'

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

const removeOffAndBackToPlain = pipe(filter(isNotOff), map(toPlainFsEntity))

export default function calcAndRemoveOffNodes(globs: Array<GlobGroup>, vfs: Folder) {
  const flatVfs = flattenFolder(vfs)
  const markedVfs = markSeverities(globs, flatVfs)

  const plainVfs = removeOffAndBackToPlain(markedVfs)

  // If there are no files, we don't need to recompose the tree
  // so, the code that uses this data can see null and skip running the rule
  return plainVfs.length ? recomposeTree(copyFsEntity(vfs), plainVfs) : null
}
