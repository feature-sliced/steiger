import { Config, ConfigObject, Severity } from '@steiger/types'

import { RuleInstructions } from './types'
import { getOptions, getSeverity, isConfigObject } from './raw-config'

function createEmptyInstructions(): RuleInstructions {
  return {
    options: null,
    globGroups: [],
  }
}

function extractRuleNames(configObject: ConfigObject) {
  return Object.keys(configObject.rules)
}

function preCreateRuleInstructions(config: Config) {
  return config
    .filter(isConfigObject)
    .flatMap(extractRuleNames)
    .reduce(
      (acc, item) => ({
        ...acc,
        [item]: createEmptyInstructions(),
      }),
      {},
    )
}

export default function createRuleInstructions(config: Config): Record<string, RuleInstructions> {
  const ruleNameToInstructions: Record<string, RuleInstructions> = preCreateRuleInstructions(config)

  return config.reduce((acc: Record<string, RuleInstructions>, item) => {
    if (isConfigObject(item)) {
      Object.entries(item.rules).forEach(
        ([ruleName, severityOrTuple]: [string, Severity | [Severity, Record<string, unknown>]]) => {
          const ruleOptions: Record<string, unknown> | null = getOptions(severityOrTuple)

          if (ruleOptions) {
            acc[ruleName].options = ruleOptions
          }

          acc[ruleName].globGroups.push({
            severity: getSeverity(severityOrTuple),
            files: item.files,
            ignores: item.ignores,
          })
        },
      )
    }

    return acc
  }, ruleNameToInstructions)
}
