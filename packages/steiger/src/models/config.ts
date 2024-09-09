import z from 'zod'
import { createEvent, createStore } from 'effector'
import { Config, ConfigObject, Plugin, Rule } from '@steiger/types'

export const $config = createStore<ConfigObject<Array<Rule>> | null>(null)
const setConfig = createEvent<ConfigObject<Array<Rule>>>()
$config.on(setConfig, (_state, payload) => payload)

export const $rules = createStore<Array<Rule>>([])
const setRules = createEvent<Array<Rule>>()
$rules.on(setRules, (_state, payload) => payload)

function processPlugins(config: Config<[]>) {
  const plugins = config.filter((item) => 'ruleDefinitions' in item) as Array<Plugin>
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

  return allRules
}

function mergeConfigObjects(config: Config<[]>) {
  // TODO: temporary simplified implementation.
  //  Implement handling the "files" and "ignores" globs in further updates.
  return config.reduce((acc: ConfigObject<Array<Rule>>, item) => {
    if ('rules' in item) {
      return { ...acc, rules: { ...acc.rules, ...item.rules } }
    }

    return acc
  }, {})
}

/**
 * Dynamically build a validation scheme based on the rules provided by plugins.
 * */
export function buildValidationScheme(rules: Array<Rule>) {
  const ruleNames = rules.map((rule) => rule.name)

  // Ensure the array has at least one element
  if (ruleNames.length === 0) {
    throw new Error('At least one rule must be provided by plugins!')
  }

  return z.object({
    // zod.record requires at least one element in the array, so we need "as [string, ...string[]]"
    rules: z
      .record(
        z.enum(ruleNames as [string, ...string[]]),
        z.union([z.enum(['off', 'error', 'warn']), z.tuple([z.enum(['error', 'warn']), z.object({}).passthrough()])]),
      )
      .refine(
        (value) => {
          const ruleNames = Object.keys(value)
          const offRules = ruleNames.filter((name) => value[name] === 'off')

          if (offRules.length === ruleNames.length || ruleNames.length === 0) {
            return false
          }

          return true
        },
        { message: 'At least one rule must be enabled' },
      ),
  })
}

export function processConfiguration(config: Config<[]>) {
  const allRules = processPlugins(config)
  const validationScheme = buildValidationScheme(allRules)
  const mergedConfig = mergeConfigObjects(config)
  const validatedConfig = validationScheme.parse(mergedConfig) as ConfigObject<Array<Rule>>

  setRules(allRules)
  setConfig(validatedConfig)

  return validatedConfig
}
