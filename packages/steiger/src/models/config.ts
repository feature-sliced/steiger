import z from 'zod'
import { createEvent, createStore } from 'effector'
import { Config, ConfigObject, Plugin, Rule } from '@steiger/types'

export const $config = createStore<ConfigObject | null>(null)
const setConfig = createEvent<ConfigObject>()
$config.on(setConfig, (_state, payload) => payload)

export const $rules = createStore<Array<Rule>>([])
const setRules = createEvent<Array<Rule>>()
$rules.on(setRules, (_state, payload) => payload)

function processPlugins(config: Config) {
  const plugins = config.filter((item) => 'ruleDefinitions' in item) as Array<Plugin>
  const allRules = plugins.flatMap((plugin) => plugin.ruleDefinitions)
  const ruleNames = new Set<string>(allRules.map((rule) => rule.name))

  // Check collisions in rule names
  if (ruleNames.size !== allRules.length) {
    throw new Error('Rule names must be unique')
  }

  return allRules
}

function mergeConfigObjects(config: Config) {
  // TODO: temporary simplified implementation.
  //  Implement handling the "files" and "ignores" globs in further updates.
  return config.reduce((acc: ConfigObject, item) => {
    if ('rules' in item) {
      return { ...acc, rules: { ...acc.rules, ...item.rules } }
    }

    return acc
  }, {})
}

/**
 * Dynamically build a validation scheme based on the rules provided by plugins.
 * */
function buildValidationScheme(rules: Array<Rule>) {
  const ruleNames = rules.map((rule) => rule.name)

  // Ensure the array has at least one element
  if (ruleNames.length === 0) {
    throw new Error('ruleNames array must have at least one element')
  }

  return z.object({
    // zod.record requires at least one element in the array, so we need "as [string, ...string[]]"
    rules: z.record(z.enum(ruleNames as [string, ...string[]]), z.enum(['off', 'error'])),
  })
}

export function processConfiguration(config: Config) {
  const allRules = processPlugins(config)
  const validationScheme = buildValidationScheme(allRules)
  const mergedConfig = mergeConfigObjects(config)
  const validatedConfig = validationScheme.parse(mergedConfig) as ConfigObject

  setRules(allRules)
  setConfig(validatedConfig)

  return validatedConfig
}
