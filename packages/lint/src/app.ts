import { createEffect, sample } from 'effector'
import { debounce, not } from 'patronum'
import fsdRules from 'fsd-rules'
import type { Folder } from '@feature-sliced/filesystem'
import type { AugmentedDiagnostic } from 'pretty-reporter'

import { scan, createWatcher } from './features/transfer-fs-to-vfs'
import { defer } from './shared/defer'

export function createLinter(_config: any) {
  async function runRules(vfs: Folder) {
    const ruleResults = await Promise.all(
      fsdRules.map((rule) =>
        Promise.resolve(rule.check(vfs, { sourceFileExtension: 'js' })).then(({ diagnostics }) =>
          diagnostics.map((d) => ({ ...d, ruleName: rule.name }) as AugmentedDiagnostic),
        ),
      ),
    )
    return ruleResults.flat()
  }
  return {
    run: (path: string) => scan(path).then(runRules),
    watch: (path: string) => {
      const { vfs, stop } = createWatcher(path)

      const treeChanged = debounce(vfs.$tree, 500)
      const runRulesFx = createEffect(runRules)

      sample({
        clock: defer({ clock: treeChanged, until: not(runRulesFx.pending) }),
        source: vfs.$tree,
        target: runRulesFx,
      })

      return [runRulesFx.doneData, stop] as const
    },
  }
}
