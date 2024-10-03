import { combine, createEvent, createStore } from 'effector'
import { Config, GlobalIgnore, Plugin } from '@steiger/types'

import createRuleInstructions from './create-rule-instructions'
import { RuleInstructions } from './types'
import buildValidationScheme from './build-validation-scheme'
import { isGlobalIgnore, isPlugin } from './raw-config'
import { transformGlobs } from './transform-globs'

type RuleInstructionsPerRule = Record<string, RuleInstructions>

export { GlobGroupWithSeverity } from './types'

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

export function processConfiguration(rawConfig: Config, configLocationFolder: string | null) {
  const validationScheme = buildValidationScheme(rawConfig)
  const validatedConfig = validationScheme.parse(rawConfig)

  const plugins = rawConfig.filter(isPlugin)
  const configTransformedGlobs = transformGlobs(validatedConfig, configLocationFolder)
  const ruleInstructions = createRuleInstructions(configTransformedGlobs)

  setPlugins(plugins)
  setGlobalIgnores(configTransformedGlobs.filter(isGlobalIgnore))
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
