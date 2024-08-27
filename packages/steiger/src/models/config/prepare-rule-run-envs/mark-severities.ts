import { File, Folder } from '@steiger/types'
import { RuleInstructions, SeverityMarkedFile, SeverityMarkedFolder } from '../types'
import { createFilterAccordingToGlobs } from '../../../shared/globs'

function markDefault(entity: File | Folder): SeverityMarkedFile | SeverityMarkedFolder {
  return {
    ...entity,
    severity: 'off',
  }
}

export default function markSeverities(
  ruleToInstructions: Record<string, RuleInstructions>,
  ruleToVfs: Record<string, Array<File | Folder>>,
): Record<string, Array<SeverityMarkedFile | SeverityMarkedFolder>> {
  const ruleToMarkedFiles: Record<string, Array<SeverityMarkedFile | SeverityMarkedFolder>> = Object.entries(
    ruleToVfs,
  ).reduce((acc, [ruleName, initialVfs]) => {
    return {
      ...acc,
      [ruleName]: initialVfs.map(markDefault),
    }
  }, {})

  Object.entries(ruleToInstructions).forEach(([rule, instructions]) => {
    const { globGroups } = instructions

    globGroups.forEach(({ severity, files, ignores }) => {
      const isApplied = createFilterAccordingToGlobs({ inclusions: files, exclusions: ignores })

      ruleToMarkedFiles[rule] = ruleToMarkedFiles[rule].map((file) => {
        const severityApplies = isApplied(file.path)
        return severityApplies
          ? {
              ...file,
              severity,
            }
          : file
      })
    })
  })

  return ruleToMarkedFiles
}
