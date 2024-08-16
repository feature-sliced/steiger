import { createEffect, sample, combine } from 'effector'
import { debounce, not } from 'patronum'
import { Rule, Folder, Severity, Context } from '@steiger/types'
import type { AugmentedDiagnostic } from '@steiger/pretty-reporter'

import { scan, createWatcher } from './features/transfer-fs-to-vfs'
import { defer } from './shared/defer'
import { $config, $rules } from './models/config'

function getRuleDescriptionUrl(ruleName: string) {
  return new URL(`https://github.com/feature-sliced/steiger/tree/master/packages/steiger-plugin-fsd/src/${ruleName}`)
}

type Config = typeof $config
type SeverityMap = Record<string, Exclude<Severity, 'off'>>

function getSeverity(value: Severity | [Severity, Record<string, unknown>]): Severity {
  return Array.isArray(value) ? value[0] : value
}

function isEnabled([, value]: [string, Severity | [Severity, Record<string, unknown>]]): boolean {
  return getSeverity(value) !== 'off'
}

// TODO: temporary dummy context. Will be provided by rule developers in the future
const context: Context = { sourceFileExtension: 'js' }

const $enabledRules = combine($config, $rules, (config, rules) => {
  const ruleConfigs = config?.rules

  if (ruleConfigs === undefined) {
    return rules
  }

  return rules.filter(
    (rule) => !(rule.name in ruleConfigs) || ruleConfigs[rule.name as keyof typeof ruleConfigs] !== 'off',
  )
})

const $severities = $config.map(
  (config) =>
    Object.fromEntries(
      Object.entries(config?.rules ?? {})
        .filter(isEnabled)
        .map(([ruleName, severityOrTuple]) => [ruleName, getSeverity(severityOrTuple)]),
    ) as SeverityMap,
)

const $ruleOptions = $config.map(
  (config) =>
    Object.fromEntries(
      Object.entries(config?.rules ?? {})
        .filter(isEnabled)
        .map(([ruleName, severityOrTuple]) => [ruleName, Array.isArray(severityOrTuple) ? severityOrTuple[1] : {}]),
    ) as Record<string, Record<string, unknown>>,
)

async function runRules({ vfs, rules, severities }: { vfs: Folder; rules: Array<Rule>; severities: SeverityMap }) {
  const ruleResults = await Promise.all(
    rules.map((rule) => {
      const optionsForCurrentRule = $ruleOptions.getState()[rule.name]

      // TODO: temporary pass undefined as global options because they are not yet implemented
      return Promise.resolve(rule.check.call(context, vfs, undefined, optionsForCurrentRule)).then(({ diagnostics }) =>
        diagnostics.map<AugmentedDiagnostic>((d) => ({
          ...d,
          ruleName: rule.name,
          getRuleDescriptionUrl,
          severity: severities[rule.name],
        })),
      )
    }),
  )
  return ruleResults.flat()
}

export const linter = {
  run: (path: string) =>
    scan(path).then((vfs) => runRules({ vfs, rules: $enabledRules.getState(), severities: $severities.getState() })),
  watch: async (path: string) => {
    const { vfs, watcher } = await createWatcher(path)

    const treeChanged = debounce(vfs.$tree, 500)
    const runRulesFx = createEffect(runRules)

    sample({
      clock: defer({ clock: [treeChanged, $enabledRules], until: not(runRulesFx.pending) }),
      source: { vfs: vfs.$tree, rules: $enabledRules, severities: $severities },
      target: runRulesFx,
    })

    return [runRulesFx.doneData, () => watcher.close()] as const
  },
}

export function defineConfig(config: Config) {
  return config
}

export type { Config }
