import { createEffect, sample, combine } from 'effector'
import { debounce, not } from 'patronum'
import { Config, Folder, Rule } from '@steiger/types'
import type { AugmentedDiagnostic } from '@steiger/pretty-reporter'

import { scan, createWatcher } from './features/transfer-fs-to-vfs'
import { defer } from './shared/defer'
import { $ruleInstructions, $rules } from './models/config'
import { prepareRuleRunEnvs } from './models/config'
import { RuleRunEnvironment } from './models/config/types'

function getRuleDescriptionUrl(ruleName: string) {
  return new URL(`https://github.com/feature-sliced/steiger/tree/master/packages/steiger-plugin-fsd/src/${ruleName}`)
}

const $enabledRules = combine($ruleInstructions, $rules, (ruleInstructions, rules) => {
  const rulesThatHaveInstructions = ruleInstructions ? Object.keys(ruleInstructions) : []

  return rules.filter((rule) => rulesThatHaveInstructions.includes(rule.name))
})

async function runRules({ vfs, rules }: { vfs: Folder; rules: Array<Rule> }) {
  const envs: Record<string, RuleRunEnvironment> = prepareRuleRunEnvs($ruleInstructions.getState() || {}, vfs)
  const ruleResults = await Promise.all(
    rules.map((rule) => {
      const ruleEnv = envs[rule.name]
      const optionsForCurrentRule = ruleEnv ? ruleEnv.ruleOptions : undefined
      const ruleVfs = ruleEnv.vfs

      if (!ruleVfs) {
        return Promise.resolve([])
      }

      return Promise.resolve(rule.check(ruleVfs, optionsForCurrentRule)).then(({ diagnostics }) =>
        diagnostics.map<AugmentedDiagnostic>((d) => ({
          ...d,
          ruleName: rule.name,
          getRuleDescriptionUrl,
          severity: ruleEnv.severityMap[d.location.path],
        })),
      )
    }),
  )
  return ruleResults.flat()
}

export const linter = {
  run: (path: string) =>
    scan(path).then((vfs) =>
      runRules({
        vfs,
        rules: $enabledRules.getState(),
      }),
    ),
  watch: async (path: string) => {
    const { vfs, watcher } = await createWatcher(path)

    const treeChanged = debounce(vfs.$tree, 500)
    const runRulesFx = createEffect(runRules)

    sample({
      clock: defer({ clock: [treeChanged, $enabledRules], until: not(runRulesFx.pending) }),
      source: {
        vfs: vfs.$tree,
        rules: $enabledRules,
      },
      target: runRulesFx,
    })

    return [runRulesFx.doneData, () => watcher.close()] as const
  },
}

export function defineConfig(config: Config) {
  return config
}
