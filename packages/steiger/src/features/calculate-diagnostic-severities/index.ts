import { getGlobsForRule } from '../../models/config'
import { calculateSeveritiesForPaths } from '../../models/vfs-severity-wizard'
import { Folder, Severity } from '@steiger/types'

export default function calculateFinalSeverities(
  vfs: Folder,
  ruleName: string,
  paths: Array<string>,
): Array<Severity | null> {
  const globGroups = getGlobsForRule(ruleName)

  if (!globGroups) {
    return []
  }

  return calculateSeveritiesForPaths(vfs, globGroups, paths)
}
