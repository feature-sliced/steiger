import z from 'zod'
import { createEvent, createStore } from 'effector'

const schema = z.object({
  rules: z.record(z.string(), z.literal('off')),
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
