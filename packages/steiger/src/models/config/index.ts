import { combine, createEvent, createStore } from 'effector'
import { Config, GlobalIgnore, Plugin } from '@steiger/types'

import createRuleInstructions from './create-rule-instructions'
import { RuleInstructions } from './types'
import buildValidationScheme from './build-validation-scheme'
import { isConfiguration, isGlobalIgnore, isPlugin } from './raw-config'

type RuleInstructionsPerRule = Record<string, RuleInstructions>

export { GlobGroup } from './types'

export const $ruleInstructions = createStore<RuleInstructionsPerRule | null>(null)
const setRuleInstructions = createEvent<RuleInstructionsPerRule>()
$ruleInstructions.on(setRuleInstructions, (_state, payload) => payload)

export const $globalIgnores = createStore<Array<GlobalIgnore>>([])
const setGlobalIgnores = createEvent<Array<GlobalIgnore>>()
$globalIgnores.on(setGlobalIgnores, (_state, payload) => payload)

export const $plugins = createStore<Array<Plugin>>([])
const setPlugins = createEvent<Array<Plugin>>()
$plugins.on(setPlugins, (_state, payload) => payload)

// Rules that are configured in the config file
export const $enabledRules = combine($ruleInstructions, $plugins, (ruleInstructions, plugins) => {
  const rulesThatHaveInstructions = ruleInstructions ? Object.keys(ruleInstructions) : []
  const allRules = plugins.flatMap((plugin) => plugin.ruleDefinitions)

  return allRules.filter((rule) => rulesThatHaveInstructions.includes(rule.name))
})

function getAllRuleNames(plugins: Array<Plugin>) {
  const allRules = plugins.flatMap((plugin) => plugin.ruleDefinitions)
  const ruleNames = allRules.map((rule) => rule.name)
  const uniqueNames = new Set<string>(ruleNames)

  // Check conflicts in rule names
  if (uniqueNames.size !== allRules.length) {
    const duplicates = ruleNames.filter((name, index) => ruleNames.indexOf(name) !== index)
    throw new Error(
      `Conflicting rule definitions found: ${duplicates.join(', ')}. Rules must be unique! Please check your plugins.`,
    )
  }

  return ruleNames
}

export function processConfiguration(rawConfig: Config) {
  const plugins = rawConfig.filter(isPlugin)
  const allRuleNames = getAllRuleNames(plugins)
  const validationScheme = buildValidationScheme(allRuleNames)
  const configObjects = rawConfig.filter(isConfiguration)
  const validatedConfig = validationScheme.parse(configObjects)
  const ruleInstructions = createRuleInstructions(validatedConfig)

  setPlugins(plugins)
  setGlobalIgnores(rawConfig.filter(isGlobalIgnore))
  setRuleInstructions(ruleInstructions)

  return validatedConfig
}

export function getPlugins() {
  return $plugins.getState()
}

export function getEnabledRules() {
  return $enabledRules.getState()
}

export function getRuleOptions(ruleName: string) {
  return $ruleInstructions.getState()?.[ruleName].options || null
}

export function getGlobalIgnores() {
  return $globalIgnores.getState()
}

export function getGlobsForRule(ruleName: string) {
  return $ruleInstructions.getState()?.[ruleName].globGroups || null
}
