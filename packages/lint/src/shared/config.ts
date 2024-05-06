import z from 'zod'

export const configSchema = z.object({
  path: z.string(),
  skipFsErrors: z.boolean().optional(),
  skipParseErrors: z.boolean().optional(),
  fileSizeLimit: z.number().optional(),
  fileNumberLimit: z.number().optional(),
  watch: z.boolean().optional(),
})

export type Config = z.infer<typeof configSchema>

export const configInternalSchema = configSchema.extend({
  cwd: z.string(),
})

export type ConfigInternal = z.infer<typeof configInternalSchema>

export const configDefault: Partial<ConfigInternal> = {
  cwd: process.cwd(),
  skipFsErrors: false,
  skipParseErrors: false,
  fileSizeLimit: 10000,
  fileNumberLimit: 1000,
  watch: false,
}
