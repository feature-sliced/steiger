import { Config, ConfigObject, PublicSeverity } from '@steiger/types'
import { reduce, flatten, filter, pipe, map } from 'ramda'

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

const preCreateRuleInstructions: (l: Config) => Record<string, RuleInstructions> = pipe(
  filter(isConfigObject),
  map(extractRuleNames),
  flatten,
  reduce(
    (acc, item: string) => ({
      ...acc,
      [item]: createEmptyInstructions(),
    }),
    {},
  ),
)

export default function createRuleInstructions(config: Config): Record<string, RuleInstructions> {
  const ruleNameToInstructions: Record<string, RuleInstructions> = preCreateRuleInstructions(config)

  return config.reduce((acc: Record<string, RuleInstructions>, item) => {
    if (isConfigObject(item)) {
      Object.entries(item.rules).forEach(
        ([ruleName, severityOrTuple]: [string, PublicSeverity | [PublicSeverity, Record<string, unknown>]]) => {
          const ruleOptions: Record<string, unknown> | null = getOptions(severityOrTuple)

          if (ruleOptions) {
            acc[ruleName].options = ruleOptions
          }

          acc[ruleName].globGroups.push({
            severity: getSeverity(severityOrTuple),
            files: item.files ? item.files : [],
            ignores: item.ignores ? item.ignores : [],
          })
        },
      )
    }

    return acc
  }, ruleNameToInstructions)
}
