import { z } from 'zod'

import { configObjectSchema, pluginSchema, globalIgnoreSchema } from '../../models/config'

const pluginDefaultExportSchema = z.object({
  plugin: pluginSchema,
  configs: z.record(z.array(z.union([globalIgnoreSchema, configObjectSchema(), pluginSchema]))),
})

export const parsePluginDefaultExport = pluginDefaultExportSchema.parseAsync
