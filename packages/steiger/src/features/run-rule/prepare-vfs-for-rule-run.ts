import { Folder } from '@steiger/types'

import { GlobGroupWithSeverity } from '../../models/config'
import { applyExclusion, not } from '../../shared/globs'

export function prepareVfsForRuleRun(vfs: Folder, globGroups: Array<GlobGroupWithSeverity>) {
  const globs = globGroups.map(({ files, ignores, severity }) =>
    severity === 'off' ? not({ files, ignores }) : { files, ignores },
  )

  return applyExclusion(vfs, globs)
}
