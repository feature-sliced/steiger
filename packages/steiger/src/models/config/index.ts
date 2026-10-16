import { createEvent, createStore } from 'effector'
import type { Config, GlobalIgnore, Plugin, Rule } from '@steiger/types'

import createRuleInstructions from './create-rule-instructions'
import { RuleInstructions } from './types'
import { validateConfig } from './validate-config'
import { isGlobalIgnore, isPlugin } from './raw-config'
import { transformGlobs } from './transform-globs'

type RuleInstructionsPerRule = Record<string, RuleInstructions>

export type { GlobGroupWithSeverity } from './types'

export interface ProcessedConfig {
  globalIgnores: GlobalIgnore[]
  plugins: Plugin[]
  ruleInstructions: RuleInstructionsPerRule
}

export const $globalConfig = createStore<ProcessedConfig | null>(null)
const setGlobalConfig = createEvent<ProcessedConfig>()
$globalConfig.on(setGlobalConfig, (_state, payload) => payload)

export function processScopedConfiguration(
  rawConfig: Config<Array<Rule>>,
  configLocationFolder: string | null,
): ProcessedConfig {
  const validatedConfig = validateConfig(rawConfig)
  const plugins = rawConfig.filter(isPlugin)
  const configTransformedGlobs = transformGlobs(validatedConfig, configLocationFolder)
  const ruleInstructions = createRuleInstructions(configTransformedGlobs)

  return {
    globalIgnores: configTransformedGlobs.filter(isGlobalIgnore),
    plugins,
    ruleInstructions,
  }
}

export function processConfiguration(rawConfig: Config<Array<Rule>>, configLocationFolder: string | null) {
  const processedConfig = processScopedConfiguration(rawConfig, configLocationFolder)
  setGlobalConfig(processedConfig)
}

export function getEnabledRules(config: ProcessedConfig): Rule[] {
  const { plugins, ruleInstructions } = config
  const rulesThatHaveInstructions = ruleInstructions ? Object.keys(ruleInstructions) : []
  const allRules = plugins.flatMap((plugin) => plugin.ruleDefinitions)

  return allRules.filter((rule) => rulesThatHaveInstructions.includes(rule.name))
}

export function getRuleOptions(config: ProcessedConfig, ruleName: string) {
  return config.ruleInstructions?.[ruleName].options || null
}

export function getGlobalIgnores(config: ProcessedConfig) {
  return config.globalIgnores
}

export function getGlobsForRule(config: ProcessedConfig, ruleName: string) {
  return config.ruleInstructions?.[ruleName].globGroups || []
}
