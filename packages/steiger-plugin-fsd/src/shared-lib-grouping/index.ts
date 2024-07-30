import { getLayers, getSegments } from '@feature-sliced/filesystem'
import type { Diagnostic, Rule } from '@steiger/types'
import { NAMESPACE } from '../constants.js'

const THRESHOLD = 15

/** Warn about too much stuff in shared/lib. */
const sharedLibGrouping = {
  name: `${NAMESPACE}/shared-lib-grouping`,
  check(root) {
    const diagnostics: Array<Diagnostic> = []

    const { shared } = getLayers(root)
    if (!shared) {
      return { diagnostics }
    }

    const { lib } = getSegments(shared)
    if (!lib) {
      return { diagnostics }
    }

    if (lib.type === 'folder' && lib.children.length > THRESHOLD) {
      diagnostics.push({
        message: `Shared/lib has ${lib.children.length} modules, which is above the recommended threshold of ${THRESHOLD}. Consider grouping them.`,
        location: { path: lib.path },
      })
    }

    return { diagnostics }
  },
} satisfies Rule

export default sharedLibGrouping
