import { Diagnostic, PartialDiagnostic, Severity } from '@steiger/types'
import { getGlobsForRule, GlobGroup } from '../../models/config'
import { createFilterAccordingToGlobs } from '../../shared/globs'

function getRuleDescriptionUrl(ruleName: string) {
  return new URL(`https://github.com/feature-sliced/steiger/tree/master/packages/steiger-plugin-fsd/src/${ruleName}`)
}

function getSeverity(path: string, globGroups: Array<GlobGroup>): Exclude<Severity, 'off'> {
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

export default function complementDiagnostics(diagnostics: Array<PartialDiagnostic>, ruleName: string) {
  const ruleGlobs = getGlobsForRule(ruleName)

  return diagnostics.map<Diagnostic>((d) => ({
    ...d,
    ruleName: ruleName,
    getRuleDescriptionUrl,
    severity: getSeverity(d.location.path, ruleGlobs || []),
  }))
}
