import z from 'zod'

import { BaseRuleOptions, Config, Plugin, Rule } from '@steiger/types'

import { getOptions, isConfigObject, isPlugin } from './raw-config'
import { isEqual } from '../../shared/objects'

const OLD_CONFIG_ERROR_MESSAGE =
  'Old configuration format detected. We are evolving!\nPlease follow this short guide to migrate to the new one:\nhttps://github.com/feature-sliced/steiger/blob/master/MIGRATION_GUIDE.md'
const WRONG_CONFIG_SHAPE_ERROR_MESSAGE =
  'The config should be an Array, but the provided config is not.\nHere is a link to the documentation that might help to fix it:\nhttps://github.com/feature-sliced/steiger?tab=readme-ov-file#configuration'
const NO_RULES_ERROR_MESSAGE = 'At least one rule must be provided by plugins!'
const NO_CONFIG_OBJECTS_ERROR_MESSAGE = 'At least one config object must be provided!'

function getAllRuleNames(plugins: Array<Plugin>) {
  const allRules = plugins.flatMap((plugin) => plugin.ruleDefinitions)
  return allRules.map((rule) => rule.name)
}

function validateConfigObjectsNumber(value: Config<Array<Rule>>, ctx: z.RefinementCtx) {
  const configObjects = value.filter(isConfigObject)

  if (configObjects.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: NO_CONFIG_OBJECTS_ERROR_MESSAGE,
    })
  }
}

function validateRuleUniqueness(value: Config<Array<Rule>>, ctx: z.RefinementCtx) {
  const allRuleNames = getAllRuleNames(value.filter(isPlugin))
  const uniqueNames = new Set<string>(allRuleNames)

  // Check conflicts in rule names (each rule can only be defined once)
  if (uniqueNames.size !== allRuleNames.length) {
    const duplicates = allRuleNames.filter((name, index) => allRuleNames.indexOf(name) !== index)
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Conflicting rule definitions found: ${duplicates.join(', ')}. Rules must be unique! Please check your plugins.`,
    })
  }
}

function validateRuleOptions(value: Config<Array<Rule>>, ctx: z.RefinementCtx) {
  const ruleToOptions: Record<string, BaseRuleOptions | null> = {}

  value.forEach((configObject) => {
    if (isConfigObject(configObject)) {
      Object.entries(configObject.rules).forEach(([ruleName, severityOrTuple]) => {
        const prevOptions = ruleToOptions[ruleName]
        const ruleOptions: BaseRuleOptions | null = getOptions(severityOrTuple)

        if (!prevOptions) {
          ruleToOptions[ruleName] = ruleOptions
          return
        }

        if (ruleOptions && prevOptions && !isEqual(ruleOptions, prevOptions)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `
                Rule "${ruleName}" has multiple options provided!
                  ${JSON.stringify(ruleToOptions[ruleName])}
                and
                  ${JSON.stringify(ruleOptions)}.
                You can only provide options for a rule once.`,
          })
        }
      })
    }
  })
}

/**
 * Dynamically build a validation scheme based on the rules provided by plugins.
 * */
export function buildValidationScheme(rawConfig: Config<Array<Rule>>) {
  const allRuleNames = getAllRuleNames(rawConfig.filter(isPlugin))

  // Make sure there's at least one rule registered by plugins
  // Need to check this before creating the scheme, because zod.enum requires at least one element
  if (allRuleNames.length === 0) {
    throw new Error(NO_RULES_ERROR_MESSAGE)
  }

  // Marked as "any" because return type is not useful for this validation
  const ruleResultScheme = z.object({
    diagnostics: z.array(z.any()),
  })

  return z
    .array(
      z.union([
        z
          .object({
            ignores: z.array(z.string()),
          })
          .passthrough(),
        z.object({
          files: z.optional(z.array(z.string())),
          ignores: z.optional(z.array(z.string())),
          // zod.record requires at least one element in the array, so we need "as [string, ...string[]]"
          rules: z.record(
            z.enum(allRuleNames as [string, ...string[]]),
            z.union([
              z.enum(['off', 'error', 'warn']),
              z.tuple([z.enum(['error', 'warn']), z.object({}).passthrough()]),
            ]),
          ),
        }),
        z.object({
          meta: z.object({
            name: z.string(),
            version: z.string(),
          }),
          getRuleDescriptionUrl: z.function().args(z.string()).returns(z.any()),
          ruleDefinitions: z.array(
            z.object({
              name: z.string(),
              check: z
                .function()
                .args()
                .returns(z.union([z.promise(ruleResultScheme), ruleResultScheme])),
            }),
          ),
        }),
      ]),
    )
    .superRefine(validateConfigObjectsNumber)
    .superRefine(validateRuleOptions)
    .superRefine(validateRuleUniqueness)
}

export function validateConfig(rawConfig: Config<Array<Rule>>) {
  const isOldConfig = typeof rawConfig === 'object' && !Array.isArray(rawConfig)
  const isWrongShape = !Array.isArray(rawConfig)

  // Need to check the shape of the config separately before validating it,
  // because building a validation scheme requires the config to be an array
  if (isOldConfig) {
    throw new Error(OLD_CONFIG_ERROR_MESSAGE)
  }

  if (isWrongShape) {
    throw new Error(WRONG_CONFIG_SHAPE_ERROR_MESSAGE)
  }

  const validationScheme = buildValidationScheme(rawConfig)
  return validationScheme.parse(rawConfig)
}
