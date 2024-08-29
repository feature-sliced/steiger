import z from 'zod'

import { isConfigObject } from './raw-config'

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
    .refine(
      (value) => {
        const configObjects = value.filter(isConfigObject)

        return configObjects.length !== 0
      },
      { message: 'At least one config object must be provided!' },
    )
}
