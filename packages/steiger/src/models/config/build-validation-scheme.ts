import z from 'zod'

import { getOptions, isConfigObject } from './raw-config'
import { isEqual } from '../../shared/objects'
import { BaseRuleOptions, Config, Severity } from '@steiger/types'

function validateConfigObjectsNumber(value: Config, ctx: z.RefinementCtx) {
  const configObjects = value.filter(isConfigObject)

  if (configObjects.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one config object must be provided!',
    })
  }
}

function validateRuleOptions(value: Config, ctx: z.RefinementCtx) {
  const ruleToOptions: Record<string, BaseRuleOptions | null> = {}

  value.forEach((configObject) => {
    if (isConfigObject(configObject)) {
      Object.entries(configObject.rules).forEach(
        ([ruleName, severityOrTuple]: [string, Severity | [Severity, Record<string, unknown>]]) => {
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
        },
      )
    }
  })
}

/**
 * Dynamically build a validation scheme based on the rules provided by plugins.
 * */
export default function buildValidationScheme(ruleNames: Array<string>) {
  // Ensure the array has at least one element
  if (ruleNames.length === 0) {
    throw new Error('At least one rule must be provided by plugins!')
  }

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
            z.enum(ruleNames as [string, ...string[]]),
            z.union([
              z.enum(['off', 'error', 'warn']),
              z.tuple([z.enum(['error', 'warn']), z.object({}).passthrough()]),
            ]),
          ),
        }),
      ]),
    )
    .superRefine(validateConfigObjectsNumber)
    .superRefine(validateRuleOptions)
}
