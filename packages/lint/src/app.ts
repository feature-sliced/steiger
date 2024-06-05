import { createEffect, sample } from 'effector'
import { debounce, not } from 'patronum'
import fsdRules from 'fsd-rules'
import type { Folder } from '@feature-sliced/filesystem'
import type { AugmentedDiagnostic } from 'pretty-reporter'

import { scan, createWatcher } from './features/transfer-fs-to-vfs'
import { defer } from './shared/defer'

export function createLinter(config: { rules: Record<string, 'off'> }) {
  const enabledRules = fsdRules.filter((rule) => !(rule.name in config.rules) || config.rules[rule.name] !== 'off')

  async function runRules(vfs: Folder) {
    const ruleResults = await Promise.all(
      enabledRules.map((rule) =>
        Promise.resolve(rule.check(vfs, { sourceFileExtension: 'js' })).then(({ diagnostics }) =>
          diagnostics.map((d) => ({ ...d, ruleName: rule.name }) as AugmentedDiagnostic),
        ),
      ),
    )
    return ruleResults.flat()
  }

  return {
    run: (path: string) => scan(path).then(runRules),
    watch: async (path: string) => {
      const { vfs, watcher } = await createWatcher(path)

      const treeChanged = debounce(vfs.$tree, 500)
      const runRulesFx = createEffect(runRules)

      sample({
        clock: defer({ clock: treeChanged, until: not(runRulesFx.pending) }),
        source: vfs.$tree,
        target: runRulesFx,
      })

      return [runRulesFx.doneData, () => watcher.close()] as const
    },
  }
}
