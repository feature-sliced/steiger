import type { ConfigObject, Plugin } from '@steiger/types'

/** Accepts a plugin as a type parameter and returns the config object for these rules. */
export type ConfigObjectOf<ThisPlugin> = ThisPlugin extends Plugin<infer Rules> ? ConfigObject<Rules> : never
