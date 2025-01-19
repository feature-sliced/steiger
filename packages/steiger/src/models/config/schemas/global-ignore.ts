import z from 'zod'

export const globalIgnoreSchema = z
  .object({
    ignores: z.array(z.string()),
  })
  .passthrough()
