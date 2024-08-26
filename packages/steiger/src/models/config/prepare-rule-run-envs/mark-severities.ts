import { File } from '@steiger/types'
import { RuleInstructions, SeverityMarkedFile } from '../types'
import { createFilterAccordingToGlobs } from '../../../shared/globs'

function markDefault(file: File): SeverityMarkedFile {
  return {
    ...file,
    severity: 'off',
  }
}

export default function markSeverities(
  ruleToInstructions: Record<string, RuleInstructions>,
  ruleToVfs: Record<string, Array<File>>,
): Record<string, Array<SeverityMarkedFile>> {
  const ruleToMarkedFiles: Record<string, Array<SeverityMarkedFile>> = Object.entries(ruleToVfs).reduce(
    (acc, [ruleName, initialVfs]) => {
      return {
        ...acc,
        [ruleName]: initialVfs.map(markDefault),
      }
    },
    {},
  )

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
