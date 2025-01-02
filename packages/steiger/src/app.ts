import { createEffect, sample } from 'effector'
import { debounce, not } from 'patronum'
import type { Config, Folder, Rule } from '@steiger/types'

import { scan, createWatcher } from './features/transfer-fs-to-vfs'
import { defer } from './shared/defer'
import { $enabledRules, getEnabledRules, getGlobalIgnores, getPluginByRuleName } from './models/config'
import { runRule } from './features/run-rule'
import { removeGlobalIgnoreFromVfs } from './features/remove-global-ignores-from-vfs'
import { calculateFinalSeverities } from './features/calculate-diagnostic-severities'
import { collapseDiagnostics } from './features/collapse-diagnostics'

async function runRules({ vfs, rules }: { vfs: Folder; rules: Array<Rule> }) {
  const vfsWithoutGlobalIgnores = removeGlobalIgnoreFromVfs(vfs, getGlobalIgnores())

  const ruleResults = await Promise.all(rules.map((rule) => runRule(vfsWithoutGlobalIgnores, rule)))
  const diagnosticsPerRule = ruleResults.map((r, ruleResultsIndex) => {
    const { diagnostics } = r
    if (diagnostics.length === 0) {
      return []
    }

    const ruleName = rules[ruleResultsIndex].name
    const ruleSourcePlugin = getPluginByRuleName(ruleName)
    const severities = calculateFinalSeverities(
      vfsWithoutGlobalIgnores,
      ruleName,
      diagnostics.map((d) => d.location.path),
    )

    return diagnostics.map((d, index) => {
      const finalDiagnostic = {
        ...d,
        ruleName,
        severity: severities[index],
      }

      if (ruleSourcePlugin.getRuleDescriptionUrl) {
        return {
          ...finalDiagnostic,
          getRuleDescriptionUrl: ruleSourcePlugin.getRuleDescriptionUrl,
        }
      }

      return finalDiagnostic
    })
  })
  const collapsedDiagnostics = collapseDiagnostics(diagnosticsPerRule)

  return collapsedDiagnostics.flat()
}

export const linter = {
  run: (path: string) =>
    scan(path).then((vfs) =>
      runRules({
        vfs,
        rules: getEnabledRules(),
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

export function defineConfig<Rules extends Array<Rule> = Array<Rule>>(config: Config<Rules>) {
  return config
}
