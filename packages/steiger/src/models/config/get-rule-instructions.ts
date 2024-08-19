import { Config, Severity } from '@steiger/types'
import { RuleInstructions } from './types'

export default function getRuleInstructions(config: Config): Record<string, RuleInstructions> {
  const ruleNameToInstructions: Record<string, RuleInstructions> = {}
  // TODO: temporary simplified implementation.
  //  Implement handling the "files" and "ignores" globs in further updates.
  return config.reduce((acc: Record<string, RuleInstructions>, item) => {
    if ('rules' in item) {
      Object.entries(item.rules!).forEach(
        ([ruleName, severityOrTuple]: [string, Severity | [Severity, Record<string, unknown>]]) => {
          if (!acc[ruleName]) {
            acc[ruleName] = {
              options: null,
              globGroups: [],
            }

            const ruleOptions: Record<string, unknown> | null = Array.isArray(severityOrTuple)
              ? severityOrTuple[1]
              : null

            if (ruleOptions && acc[ruleName].options) {
              throw new Error(
                `
                Rule "${ruleName}" has multiple options provided! 
                  ${JSON.stringify(acc[ruleName].options)} 
                and
                  ${JSON.stringify(ruleOptions)}.
                You can only provide options for a rule once.`,
              )
            }

            if (ruleOptions) {
              acc[ruleName].options = ruleOptions
            }

            if (item.files || item.ignores) {
              acc[ruleName].globGroups.push({
                severity: Array.isArray(severityOrTuple) ? severityOrTuple[0] : severityOrTuple,
                files: item.files ?? [],
                ignores: item.ignores ?? [],
              })
            }
          }
        },
      )
    }

    return acc
  }, ruleNameToInstructions)
}
