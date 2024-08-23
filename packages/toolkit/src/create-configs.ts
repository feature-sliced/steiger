import type { Config, ConfigObject, OptionsForRule, Plugin, Rule, RuleNames, Severity } from '@steiger/types'

export function enableAllRules<Context, Rules extends Array<Rule>>(
  plugin: Plugin<Context, Rules>,
  options?: { severity: Exclude<Severity, 'off'> },
): [Plugin<Context, Rules>, ConfigObject<Rules>] {
  return [
    plugin,
    {
      rules: Object.fromEntries(plugin.ruleDefinitions.map((rule) => [rule.name, options?.severity ?? 'error'])) as {
        [key in RuleNames<Rules>]?: Severity | [Severity, OptionsForRule<Rules, key>]
      },
    },
  ]
}

export function createConfigs(configs: Record<string, Config>): Record<string, Config> {
  return configs
}
