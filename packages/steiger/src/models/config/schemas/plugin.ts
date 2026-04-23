import z from 'zod'

const ruleResultSchema = z.object({
  // Marked as "any" because return type is not useful for this validation
  diagnostics: z.array(z.any()),
})

export const pluginSchema = z.object({
  meta: z.object({
    name: z.string(),
    version: z.string(),
  }),
  getRuleDescriptionUrl: z.optional(z.function().args(z.string()).returns(z.any())),
  ruleDefinitions: z.array(
    z.object({
      name: z.string(),
      check: z
        .function()
        .args()
        .returns(z.union([z.promise(ruleResultSchema), ruleResultSchema])),
    }),
  ),
})
