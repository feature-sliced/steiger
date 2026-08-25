import { isIndex } from '@feature-sliced/filesystem'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'

import { indexSourceFiles } from '../_lib/index-source-files.js'
import { extractWildcardExports, getSourceType } from '../_language-tools/index.js'
import { NAMESPACE } from '../constants.js'

/** Forbid wildcard re-exports (`export * from`) in public APIs. */
const noWildcardExports = {
  name: `${NAMESPACE}/no-wildcard-exports` as const,
  async check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    for (const sourceFile of Object.values(indexSourceFiles(root))) {
      if (!isIndex(sourceFile.file)) continue

      const sourceType = getSourceType(sourceFile.file.path)
      if (!sourceType) continue

      const wildcardExports = await extractWildcardExports(sourceFile.file.path)
      for (const wildcardExport of wildcardExports) {
        diagnostics.push({
          message: `Wildcard export from "${wildcardExport.path}" hides the public API. List the exported names instead.`,
          location: {
            path: sourceFile.file.path,
            start: wildcardExport.start,
            end: wildcardExport.end,
          },
        })
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default noWildcardExports
