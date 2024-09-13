import { sep, posix } from 'node:path'

import { Config, ConfigObject, Severity } from '@steiger/types'
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

function convertRelativeGlobsToAbsolute(rootPath: string, globs: Array<string>) {
  function composeAbsolutePath(root: string, glob: string) {
    // Remove '/'. The root has platform-specific separators
    const segmentsOfRoot = root.slice(1).split(sep)

    return `/${posix.join(...segmentsOfRoot, glob)}`
  }

  return globs.map((glob) => (glob.startsWith('.') ? composeAbsolutePath(rootPath, glob) : glob))
}

export default function createRuleInstructions(
  config: Config,
  configLocationPath: string | null,
): Record<string, RuleInstructions> {
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
            // Config file location is not null if we have any globs, because they are set in the config file.
            files: item.files ? convertRelativeGlobsToAbsolute(configLocationPath!, item.files) : [],
            ignores: item.ignores ? convertRelativeGlobsToAbsolute(configLocationPath!, item.ignores) : [],
          })
        },
      )
    }

    return acc
  }, ruleNameToInstructions)
}
