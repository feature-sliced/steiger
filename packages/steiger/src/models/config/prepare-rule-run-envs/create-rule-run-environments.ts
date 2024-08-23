import { pipe, filter, map } from 'ramda'
import { Folder } from '@steiger/types'
import { RuleInstructions, RuleRunEnvironment, SeverityMarkedFile } from '../types'

import { recomposeTree } from '../../../shared/file-system'

function isNotOff({ severity }: SeverityMarkedFile) {
  return severity !== 'off'
}

function toPlainFile({ path, type }: SeverityMarkedFile) {
  return {
    path,
    type,
  }
}

export default function createRuleRunEnvironments(
  ruleToMarkedVfs: Record<string, Array<SeverityMarkedFile>>,
  ruleInstructions: Record<string, RuleInstructions>,
  root: Folder,
): Record<string, RuleRunEnvironment> {
  return Object.entries(ruleToMarkedVfs).reduce((acc, [ruleName, markedVfs]) => {
    const { options } = ruleInstructions[ruleName]
    const processVfs = pipe(filter(isNotOff), map(toPlainFile))

    const files = processVfs(markedVfs)

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
        // If there are no files, we don't need to recompose the tree
        // so, the code that uses this data can see null and skip running the rule
        vfs: files.length ? recomposeTree(root, files) : null,
        ruleOptions: options,
      },
    }
  }, {})
}
