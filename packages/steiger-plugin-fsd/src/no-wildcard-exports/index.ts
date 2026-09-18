import { isIndex } from '@feature-sliced/filesystem'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'

import { indexSourceFiles } from '../_lib/index-source-files.js'
import { extractReExports, getSourceType } from '../_language-tools/index.js'
import { NAMESPACE } from '../constants.js'

/** Forbid wildcard re-exports (`export * from`, `export * as ns from`) in public APIs. */
const noWildcardExports = {
  name: `${NAMESPACE}/no-wildcard-exports` as const,
  async check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    for (const sourceFile of Object.values(indexSourceFiles(root))) {
      if (!isIndex(sourceFile.file)) continue

      const sourceType = getSourceType(sourceFile.file.path)
      if (!sourceType) continue

      for (const reExport of await extractReExports(sourceFile.file.path)) {
        if (reExport.kind !== 'all' && reExport.kind !== 'namespace') continue

        diagnostics.push({
          message: `Wildcard re-export from "${reExport.source}" does not define an explicit public API. Prefer explicit named exports.`,
          location: {
            path: sourceFile.file.path,
            start: reExport.statementRange.start,
            end: reExport.statementRange.end,
          },
        })
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default noWildcardExports
