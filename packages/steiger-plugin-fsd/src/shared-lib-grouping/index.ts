import { getLayers, getSegments } from '@feature-sliced/filesystem'
import type { Diagnostic, Rule, RuleOptions } from '@steiger/types'
import { NAMESPACE } from '../constants.js'

const DEFAULT_THRESHOLD = 15

export interface SharedLibGroupingOptions extends RuleOptions {
  threshold?: number
}

/** Warn about too much stuff in shared/lib. */
const sharedLibGrouping = {
  name: `${NAMESPACE}/shared-lib-grouping`,
  check(root, _, ruleOptions?: SharedLibGroupingOptions) {
    const threshold = ruleOptions?.threshold ?? DEFAULT_THRESHOLD
    const diagnostics: Array<Diagnostic> = []

    const { shared } = getLayers(root)
    if (!shared) {
      return { diagnostics }
    }

    const { lib } = getSegments(shared)
    if (!lib) {
      return { diagnostics }
    }

    if (lib.type === 'folder' && lib.children.length > threshold) {
      diagnostics.push({
        message: `Shared/lib has ${lib.children.length} modules, which is above the recommended threshold of ${threshold}. Consider grouping them.`,
        location: { path: lib.path },
      })
    }

    return { diagnostics }
  },
} satisfies Rule

export default sharedLibGrouping
