import type { Plugin, Rule } from '@steiger/types'

export function createPlugin<const Context, const Rules extends Array<Rule<Context>>>(
  plugin: Plugin<Context, Rules>,
): Plugin<Context, Rules> {
  return plugin
}
