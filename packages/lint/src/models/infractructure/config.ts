import z from 'zod'
import { createEvent, createStore } from 'effector'

// TODO deep configuration
/*
export const configSchema = z.object({
  watch: z.boolean().optional(),
  temp: z.object({
    typescript: z.boolean()
  }),
  input: z.object({
    path: z.string(),
    parser: z.string().optional(),
  }).optional(),
  output: z.object({
    stream: z.enum(['file', 'console']).optional(),
    formatter: z.string().optional(),
  }).optional(),
  errors: z.object({
    config: z.enum(['ignore', 'warn', 'fatal']).optional(),
    filesystem: z.enum(['ignore', 'warn', 'fatal']).optional(),
    parsing: z.enum(['ignore', 'warn', 'fatal']).optional(),
  }),
  limits: z.object({
    fileSize: z.number().optional(),
    fileNumber: z.number().optional(),
    parsingTime: z.number().optional(),
  }),
  ignore: z.object({
    gitignore: z.boolean(),
    fsdignore: z.boolean(),
    npmignore: z.boolean(),
  })
})
*/

// TODO use single source for config interface, config validator and cli args parser
/*
export interface ConfigField {
  name: string
  validator: ZodSchema
  description: string
  alias: string | Array<string>
}
const configFields: Array<ConfigField> = [{
  name: 'watch',
  validator: z.boolean(),
  description: 'watch filesystem changes',
  alias: ['watch', 'w']
}]
*/

const schema = z.object({
  path: z.string(),
  skipFsErrors: z.boolean().optional(),
  skipParseErrors: z.boolean().optional(),
  fileSizeLimit: z.number().optional(),
  fileNumberLimit: z.number().optional(),
  watch: z.boolean().optional(),
  typescript: z.boolean().optional(),
  gitignore: z.boolean().optional(),
  npmignore: z.boolean().optional(),
  fsdignore: z.boolean().optional(),
})

export type Config = z.infer<typeof schema>

const store = createStore<Config | null>(null)
const set = createEvent<Config>()
store.on(set, (state, payload) => payload)

export const config = {
  schema,
  store,
  set,
}
