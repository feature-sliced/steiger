import { pipe, filter, map } from 'ramda'
import { Folder } from '@steiger/types'
import { RuleInstructions, RuleRunEnvironment, SeverityMarkedFile } from './types'

import { copyFsEntity, recomposeTree } from '../../shared/file-system'

function isNotOff({ severity }: SeverityMarkedFile) {
  return severity !== 'off'
}

function toPlainFile({ path, type }: SeverityMarkedFile) {
  return {
    path,
    type,
  }
}

export default function getRuleRunEnvironments(
  ruleToMarkedVfs: Record<string, Array<SeverityMarkedFile>>,
  ruleInstructions: Record<string, RuleInstructions>,
  root: Folder,
): Record<string, RuleRunEnvironment> {
  return Object.entries(ruleToMarkedVfs).reduce((acc, [ruleName, markedVfs]) => {
    const { options } = ruleInstructions[ruleName]
    const processVfs = pipe(filter(isNotOff), map(toPlainFile))

    const files = processVfs(markedVfs)
    const finalVfs = copyFsEntity(root)

    recomposeTree(finalVfs, files)
    const severityMap = markedVfs.reduce((acc, { path, severity }) => {
      return {
        ...acc,
        [path]: severity,
      }
    }, {})

    return {
      ...acc,
      [ruleName]: {
        severityMap,
        vfs: finalVfs,
        ruleOptions: options,
      },
    }
  }, {})
}
