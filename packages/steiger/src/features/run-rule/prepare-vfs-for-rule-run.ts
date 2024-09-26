import { Folder } from '@steiger/types'

import { getVfsWithoutOffNodes } from '../../models/vfs-severity-map'
import { GlobGroup } from '../../models/config'

export function prepareVfsForRuleRun(vfs: Folder, globGroups: Array<GlobGroup>) {
  return getVfsWithoutOffNodes(vfs, globGroups)
}
