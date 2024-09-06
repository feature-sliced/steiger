import { Config, ConfigObject, Severity } from '@steiger/types'
import { reduce, flatten, filter, pipe, map } from 'ramda'

import { RuleInstructions } from './types'
import { isConfigObject } from './raw-config'
import { isEqual } from '../../shared/objects'

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
      Object.entries(item.rules!).forEach(
        ([ruleName, severityOrTuple]: [string, Severity | [Severity, Record<string, unknown>]]) => {
          const prevOptions = acc[ruleName].options
          const ruleOptions: Record<string, unknown> | null = Array.isArray(severityOrTuple) ? severityOrTuple[1] : null

          // TODO: try to move to validation
          if (ruleOptions && prevOptions && !isEqual(ruleOptions, prevOptions)) {
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

          acc[ruleName].globGroups.push({
            severity: Array.isArray(severityOrTuple) ? severityOrTuple[0] : severityOrTuple,
            files: item.files ?? [],
            ignores: item.ignores ?? [],
          })
        },
      )
    }

    return acc
  }, ruleNameToInstructions)
}
