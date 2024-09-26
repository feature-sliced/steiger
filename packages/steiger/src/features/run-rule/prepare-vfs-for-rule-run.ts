import { Folder } from '@steiger/types'

import { getVfsWithoutOffNodes } from '../../models/vfs-severity-wizard'
import { GlobGroup } from '../../models/config'

export function prepareVfsForRuleRun(vfs: Folder, globGroups: Array<GlobGroup>) {
  return getVfsWithoutOffNodes(vfs, globGroups)
}
