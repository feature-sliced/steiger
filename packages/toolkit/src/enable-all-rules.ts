import type { ConfigObject, Plugin, Severity } from '@steiger/types'

export function enableAllRules<Rules extends string>(
  plugin: Plugin<Rules>,
  options?: { severity: Exclude<Severity, 'off'> },
): [Plugin<Rules>, ConfigObject<Rules>] {
  return [
    plugin,
    {
      rules: Object.fromEntries(
        plugin.ruleDefinitions.map((rule) => [rule.name, options?.severity ?? 'error']),
      ) as Record<Rules, Severity>,
    },
  ]
}
