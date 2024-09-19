import { Severity } from '@steiger/types'
import { getGlobsForRule, GlobGroup } from '../../models/config'
import { createFilterAccordingToGlobs } from '../../shared/globs'

function getFinalSeverity(path: string, globGroups: Array<GlobGroup>): Exclude<Severity, 'off'> {
  let finalSeverity: Severity = 'error'

  for (const { severity, files, ignores } of globGroups) {
    const isApplied = createFilterAccordingToGlobs({ inclusions: files, exclusions: ignores })

    // If the severity is off, we skipped the file initially
    // and didn't run the rule for it
    if (severity === 'off') {
      continue
    }

    if (isApplied(path)) {
      finalSeverity = severity
    }
  }

  return finalSeverity
}

export default function calculateSeverity(path: string, ruleName: string) {
  const ruleGlobs = getGlobsForRule(ruleName)

  return getFinalSeverity(path, ruleGlobs || [])
}
