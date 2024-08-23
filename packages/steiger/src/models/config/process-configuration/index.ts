import z from 'zod'
import { createEvent, createStore } from 'effector'
import { Config, ConfigObject, Plugin, Rule } from '@steiger/types'

import createRuleInstructions from './create-rule-instructions'
import { RuleInstructions } from '../types'

type RuleInstructionsPerRule = Record<string, RuleInstructions>

export const $ruleInstructions = createStore<RuleInstructionsPerRule | null>(null)
const setRuleInstructions = createEvent<RuleInstructionsPerRule>()
$ruleInstructions.on(setRuleInstructions, (_state, payload) => payload)

export const $rules = createStore<Array<Rule>>([])
const setRules = createEvent<Array<Rule>>()
$rules.on(setRules, (_state, payload) => payload)

function getConfigObjects(config: Config): Array<ConfigObject> {
  return config.filter((item) => 'rules' in item)
}

function processPlugins(config: Config) {
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

/**
 * Dynamically build a validation scheme based on the rules provided by plugins.
 * */
export function buildValidationScheme(rules: Array<Rule>) {
  const ruleNames = rules.map((rule) => rule.name)

  // Ensure the array has at least one element
  if (ruleNames.length === 0) {
    throw new Error('At least one rule must be provided by plugins!')
  }

  return z
    .array(
      z.object({
        files: z.optional(z.array(z.string())),
        ignores: z.optional(z.array(z.string())),
        // zod.record requires at least one element in the array, so we need "as [string, ...string[]]"
        rules: z.record(
          z.enum(ruleNames as [string, ...string[]]),
          z.union([z.enum(['off', 'error', 'warn']), z.tuple([z.enum(['error', 'warn']), z.object({}).passthrough()])]),
        ),
      }),
    )
    .refine(
      (value) => {
        const configObjects = value.filter((item) => 'rules' in item)

        if (configObjects.length === 0) {
          return false
        }

        return true
      },
      { message: 'At least one config object must be provided!' },
    )
}

export function processConfiguration(config: Config) {
  const allRules = processPlugins(config)
  const validationScheme = buildValidationScheme(allRules)
  const configObjects = getConfigObjects(config)
  const validatedConfig = validationScheme.parse(configObjects)
  const ruleInstructions = createRuleInstructions(validatedConfig)

  setRules(allRules)
  setRuleInstructions(ruleInstructions)

  return validatedConfig
}
