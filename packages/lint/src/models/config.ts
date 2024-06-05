import z from 'zod'
import { createEvent, createStore } from 'effector'

const schema = z.object({
  rules: z.record(z.string(), z.literal('off')),
})

export type Config = z.infer<typeof schema>

export const $config = createStore<Config | null>(null)
export const setConfig = createEvent<Config>()

$config.on(setConfig, (_state, payload) => payload)

