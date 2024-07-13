import z from 'zod'
import { createEvent, createStore } from 'effector'

export const schema = z.object({
  rules: z
    .record(
      z.enum([
        'ambiguous-slice-names',
        'excessive-slicing',
        'forbidden-imports',
        'inconsistent-naming',
        'insignificant-slice',
        'no-layer-public-api',
        'no-public-api-sidestep',
        'no-reserved-folder-names',
        'no-segmentless-slices',
        'no-segments-on-sliced-layers',
        'public-api',
        'repetitive-naming',
        'segments-by-purpose',
        'shared-lib-grouping',
      ]),
      z.literal('off'),
    )
    .optional(),
})

export type Config = z.infer<typeof schema>

export const $config = createStore<Config | null>(null)
export const setConfig = createEvent<Config>()

$config.on(setConfig, (_state, payload) => payload)
