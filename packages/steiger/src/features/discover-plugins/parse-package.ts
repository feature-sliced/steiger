import { z } from 'zod'

const partialPackageJsonSchema = z.object({
  dependencies: z.optional(z.record(z.string())),
  devDependencies: z.optional(z.record(z.string())),
})

export const parsePackage = partialPackageJsonSchema.parseAsync
