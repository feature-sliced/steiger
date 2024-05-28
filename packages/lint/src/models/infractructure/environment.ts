import z from 'zod'
import { createEvent, createStore } from 'effector'

const schema = z.object({
  cwd: z.string(),
})

export type Environment = z.infer<typeof schema>

const store = createStore<Environment | null>(null)
const set = createEvent<Environment | null>()
store.on(set, (state, payload) => payload)

export const environment = {
  schema,
  store,
  set,
}
