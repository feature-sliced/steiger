import { performance } from 'node:perf_hooks'
import { Console } from 'node:console'
import { createEffect, merge, sample } from 'effector'
import { debounce, not } from 'patronum'
import type { Config, Folder, Rule } from '@steiger/types'

import { scan, createWatcher } from './features/transfer-fs-to-vfs'
import { defer } from './shared/defer'
import { $enabledRules, getEnabledRules, getGlobalIgnores, processConfiguration } from './models/config'
import { runRule } from './features/run-rule'
import { removeGlobalIgnoreFromVfs } from './features/remove-global-ignores-from-vfs'
import { calculateFinalSeverities } from './features/calculate-diagnostic-severities'

// TODO: make this part of a plugin
function getRuleDescriptionUrl(ruleName: string) {
  const withoutNamespace = ruleName.split('/')[1]
  return new URL(
    `https://github.com/feature-sliced/steiger/tree/master/packages/steiger-plugin-fsd/src/${withoutNamespace}`,
  )
}

function isTimingEnabled() {
  const timing = process.env.TIMING
  return timing && timing !== '0' && timing !== 'false'
}

async function runRules({ vfs, rules }: { vfs: Folder; rules: Array<Rule> }) {
  const vfsWithoutGlobalIgnores = removeGlobalIgnoreFromVfs(vfs, getGlobalIgnores())

  const timingEnabled = isTimingEnabled()
  const measurements: Array<{ rule: string; duration: number }> = []

  const ruleResults = await Promise.all(
    rules.map(async (rule) => {
      const start = performance.now()
      try {
        return await runRule(vfsWithoutGlobalIgnores, rule)
      } finally {
        const end = performance.now()
        if (timingEnabled) {
          measurements.push({ rule: rule.name, duration: end - start })
        }
      }
    }),
  )

  if (timingEnabled) {
    new Console(process.stderr).table(
      measurements
        .sort((a, b) => b.duration - a.duration)
        .map((m) => ({ Rule: m.rule, Duration: +m.duration.toFixed(2) })),
    )
  }

  return ruleResults.flatMap(({ diagnostics }, ruleResultsIndex) => {
    const ruleName = rules[ruleResultsIndex].name
    const severities = calculateFinalSeverities(
      vfsWithoutGlobalIgnores,
      ruleName,
      diagnostics.map((d) => d.location.path),
    )

    return diagnostics
      .sort((a, b) => a.location.path.localeCompare(b.location.path))
      .map((d, index) => ({
        ...d,
        ruleName,
        getRuleDescriptionUrl,
        severity: severities[index],
      }))
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
  watch: async (
    path: string,
    options?: { stabilityThreshold?: number; pollInterval?: number; debounceInterval?: number },
  ) => {
    const { vfs, watcher } = await createWatcher(path, options)

    const treeChanged = debounce(merge([vfs.$tree, vfs.fileChanged]), options?.debounceInterval ?? 500)
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

export { processConfiguration }
