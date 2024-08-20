import type { Plugin } from '@steiger/types'

export function createPlugin<Rules extends string>(plugin: Plugin<Rules>) {
  return plugin
}
