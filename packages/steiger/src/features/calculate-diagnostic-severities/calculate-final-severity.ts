import { Folder, Severity } from '@steiger/types'

import { getGlobsForRule } from '../../models/config'
import { applyExclusion, not } from '../../shared/globs'
import { isPathInTree } from '../../shared/file-system'

export default function calculateFinalSeverities(
  vfs: Folder,
  ruleName: string,
  paths: Array<string>,
): Array<Exclude<Severity, 'off'>> {
  const globGroups = getGlobsForRule(ruleName)

  if (!globGroups) {
    return []
  }

  const errorGlobs = globGroups.map(({ severity, ...rest }) => (severity === 'error' ? { ...rest } : not({ ...rest })))
  const errorVfs = applyExclusion(vfs, errorGlobs)

  return (<Array<boolean>>isPathInTree(errorVfs, paths)).map((isError) => (isError ? 'error' : 'warn'))
}
