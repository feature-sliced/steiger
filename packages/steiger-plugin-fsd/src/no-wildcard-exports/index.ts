import { basename } from 'node:path'
import { parseSync } from 'oxc-parser'
import type { PartialDiagnostic, Rule, File } from '@steiger/toolkit'
import { NAMESPACE } from '../constants.js'
import { indexSourceFiles } from '../_lib/index-source-files.js'

type FileWithContent = File & { content?: string }

const noWildcardExports = {
  name: `${NAMESPACE}/no-wildcard-exports` as const,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    // Index all source files according to the FSD structure
    const sourceFiles = indexSourceFiles(root)

    for (const sourceFile of Object.values(sourceFiles)) {
      const file = sourceFile.file

      if (!/\.(js|jsx|ts|tsx)$/.test(file.path)) continue

      // Allow wildcard exports in unsliced layers (shared, app)
      if (sourceFile.layerName === 'shared' || sourceFile.layerName === 'app') continue

      // Check if this is a public API file (typically index.* files)
      const fileName = basename(file.path)
      const isPublicApiFile = /^index\.(js|jsx|ts|tsx)$/.test(fileName)

      // Skip files that are not public API
      if (!isPublicApiFile) continue

      // Parse file content using oxc-parser
      const content = (file as FileWithContent).content
      if (!content) continue // Skip if file has no contents

      const parseResult = parseSync(file.path, content)

      // Inspect export statements in the AST
      for (const statement of parseResult.program.body) {
        // Look for "export * from '...'" patterns
        if (statement.type === 'ExportAllDeclaration' && statement.source) {
          // Allow "export * as namespace from '...'" patterns
          if (statement.exported) continue

          // Add a diagnostic if a wildcard export is found in a public API file
          diagnostics.push({
            message: 'Wildcard exports are not allowed in public APIs. Use named exports instead.',
            location: { path: file.path },
            fixes: [
              {
                type: 'modify-file',
                path: file.path,
                content:
                  '// Replace with named exports\n// Example: export { ComponentA, ComponentB } from "./components"',
              },
            ],
          })
        }
      }
    }
    return { diagnostics }
  },
} satisfies Rule

export default noWildcardExports
