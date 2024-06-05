import { combine, createEffect, sample } from 'effector'
import { debounce, not } from 'patronum'
import fsdRules, { type Rule } from 'fsd-rules'
import type { Folder } from '@feature-sliced/filesystem'
import type { AugmentedDiagnostic } from 'pretty-reporter'

import { scan, createWatcher } from './features/transfer-fs-to-vfs'
import { defer } from './shared/defer'
import { $config } from './models/config'

const enabledRules = $config.map((config) =>
  config === null
    ? fsdRules
    : fsdRules.filter((rule) => !(rule.name in config.rules) || config.rules[rule.name] !== 'off'),
)

async function runRules({ vfs, rules }: { vfs: Folder; rules: Array<Rule> }) {
  const ruleResults = await Promise.all(
    rules.map((rule) =>
      Promise.resolve(rule.check(vfs, { sourceFileExtension: 'js' })).then(({ diagnostics }) =>
        diagnostics.map((d) => ({ ...d, ruleName: rule.name }) as AugmentedDiagnostic),
      ),
    ),
  )
  return ruleResults.flat()
}

export const linter = {
  run: (path: string) => scan(path).then((vfs) => runRules({ vfs, rules: enabledRules.getState() })),
  watch: async (path: string) => {
    const { vfs, watcher } = await createWatcher(path)

    const treeChanged = debounce(vfs.$tree, 500)
    const runRulesFx = createEffect(runRules)

    sample({
      clock: defer({ clock: combine(treeChanged, enabledRules), until: not(runRulesFx.pending) }),
      source: { vfs: vfs.$tree, rules: enabledRules },
      target: runRulesFx,
    })

    return [runRulesFx.doneData, () => watcher.close()] as const
  },
}
