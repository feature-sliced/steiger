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

export function enableSpecificRules<Context, Rules extends Array<Rule>>(
  plugin: Plugin<Context, Rules>,
  rulesToEnable: Rules,
  options?: { severity: Exclude<Severity, 'off'> },
): [Plugin<Context, Rules>, ConfigObject<Rules>] {
  return [
    plugin,
    {
      rules: Object.fromEntries(
        plugin.ruleDefinitions
          .filter((rule) => rulesToEnable.map((ruleToEnable) => ruleToEnable.name).includes(rule.name))
          .map((rule) => [rule.name, options?.severity ?? 'error']),
      ) as {
        [key in RuleNames<Rules>]?: Severity | [Severity, OptionsForRule<Rules, key>]
      },
    },
  ]
}

export function createConfigs<const Rules extends Array<Rule> = Array<Rule>, Keys extends string = string>(
  configs: Record<Keys, Config<Rules>>,
): Record<Keys, Config<Rules>> {
  return configs
}

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest

  it('enables only specific rules with the given severity', () => {
    type TestContext = unknown

    const mockPlugin: Plugin<TestContext> = {
      meta: {
        name: 'test',
        version: '0.0.0',
      },
      ruleDefinitions: [
        {
          name: 'ruleA',
          check: () => ({ diagnostics: [] }),
        },
        {
          name: 'ruleB',
          check: () => ({ diagnostics: [] }),
        },
        {
          name: 'ruleC',
          check: () => ({ diagnostics: [] }),
        },
      ],
    }

    const rulesToEnable = [
      {
        name: 'ruleA',
        check: () => ({ diagnostics: [] }),
      },
      {
        name: 'ruleC',
        check: () => ({ diagnostics: [] }),
      },
    ]

    const [plugin, config] = enableSpecificRules(mockPlugin, rulesToEnable, { severity: 'warn' })

    expect(plugin).toEqual(mockPlugin)
    expect(config).toEqual({
      rules: {
        ruleA: 'warn',
        ruleC: 'warn',
      },
    })
  })
}
