import { Folder } from '@steiger/types'

import createVfsWithSeverity from './create-vfs-with-severity'
import markSeverities from './mark-severities'
import { GlobGroup } from '../../models/config'
import { flattenFolder } from '../../shared/file-system'

export default function applySeverityGlobsToVfs(globs: Array<GlobGroup>, vfs: Folder) {
  const flatVfs = flattenFolder(vfs)
  const ruleToMarkedVfs = markSeverities(globs, flatVfs)

  return createVfsWithSeverity(ruleToMarkedVfs, vfs)
}
