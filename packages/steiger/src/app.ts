import { createEffect, sample } from 'effector'
import { debounce, not } from 'patronum'
import { Config, Folder, Rule } from '@steiger/types'

import { scan, createWatcher } from './features/transfer-fs-to-vfs'
import { defer } from './shared/defer'
import { $enabledRules, getEnabledRules, getGlobsForRule } from './models/config'
import { runRule } from './features/run-rule'
import CreateVfsSeverityWizard from './features/vfs-severity-wizard'
import { DiagnosticSeverity } from './shared/severity'

function getRuleDescriptionUrl(ruleName: string) {
  return new URL(`https://github.com/feature-sliced/steiger/tree/master/packages/steiger-plugin-fsd/src/${ruleName}`)
}

async function runRules({ vfs, rules }: { vfs: Folder; rules: Array<Rule> }) {
  const ruleResults = await Promise.all(rules.map((rule) => runRule(vfs, rule)))
  return ruleResults.flatMap((r, ruleResultsIndex) => {
    if (r.diagnostics.length === 0) {
      return []
    }

    const ruleName = rules[ruleResultsIndex].name
    const globsForRule = getGlobsForRule(ruleName)

    if (!globsForRule) {
      throw new Error(`Severity settings for rule ${ruleName} are not found but rule is enabled`)
    }

    const vfsSeverityWizard = CreateVfsSeverityWizard(vfs, globsForRule)

    return r.diagnostics
      .filter((d) => {
        const severity = vfsSeverityWizard.getSeverityForPath(d.location.path)

        return severity !== 'off' && severity !== 'excluded'
      })
      .map((d) => {
        const diagnosticSeverity = vfsSeverityWizard.getSeverityForPath(d.location.path)

        return {
          ...d,
          ruleName,
          getRuleDescriptionUrl,
          severity: <DiagnosticSeverity>diagnosticSeverity,
        }
      })
  })
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

export function defineConfig(config: Config) {
  return config
}
