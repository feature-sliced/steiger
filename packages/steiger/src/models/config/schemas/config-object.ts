import z from 'zod'

// z.enum requires at least one element in the array, so we need "[string, ...string[]]"
export const configObjectSchema = (allRuleNames?: [string, ...string[]]) =>
  z.object({
    files: z.optional(z.array(z.string())),
    ignores: z.optional(z.array(z.string())),
    rules: z.record(
      allRuleNames !== undefined ? z.enum(allRuleNames) : z.string(),
      z.union([z.enum(['off', 'error', 'warn']), z.tuple([z.enum(['error', 'warn']), z.object({}).passthrough()])]),
    ),
  })
