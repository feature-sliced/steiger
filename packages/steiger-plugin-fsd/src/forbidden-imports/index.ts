import * as fs from 'node:fs'
import { join } from 'node:path'
import { layerSequence, isCrossImportPublicApi } from '@feature-sliced/filesystem'
import precinct from 'precinct'
const { paperwork } = precinct
import { parse as parseNearestTsConfig } from 'tsconfck'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'

import { indexSourceFiles } from '../_lib/index-source-files.js'
import { collectRelatedTsConfigs } from '../_lib/collect-related-ts-configs.js'
import { resolveDependency } from '../_lib/resolve-dependency.js'
import { NAMESPACE } from '../constants.js'

import { Parser, Query, Language } from 'web-tree-sitter'

await Parser.init()
const lang = await Language.load(
  join(import.meta.dirname, '..', '..', 'node_modules', 'tree-sitter-typescript', 'tree-sitter-tsx.wasm'),
)

const forbiddenImports = {
  name: `${NAMESPACE}/forbidden-imports` as const,
  async check(root) {
    const diagnostics: Array<PartialDiagnostic> = []
    const parseResult = await parseNearestTsConfig(root.children[0]?.path ?? root.path)
    const tsConfigs = collectRelatedTsConfigs(parseResult)
    const sourceFileIndex = indexSourceFiles(root)

    for (const sourceFile of Object.values(sourceFileIndex)) {
      console.log(sourceFile.file.path)
      const a1 = performance.now()
      const parser = new Parser()
      parser.setLanguage(lang)
      const query = new Query(lang, `(import_statement source: (string (string_fragment) @path))`)
      const tree = parser.parse(fs.readFileSync(sourceFile.file.path, 'utf8'))
      const matches = query.matches(tree.rootNode)
      const dependencies = matches.flatMap((m) => m.captures.map((c) => c.node.text))
      console.log('tree-sitter in', performance.now() - a1, 'ms')

      const a2 = performance.now()
      paperwork(sourceFile.file.path, { includeCore: false, fileSystem: fs })
      console.log('paperwork in', performance.now() - a2, 'ms\n')
      for (const dependency of dependencies) {
        const resolvedDependency = resolveDependency(
          dependency,
          sourceFile.file.path,
          tsConfigs,
          fs.existsSync,
          fs.existsSync,
        )

        if (resolvedDependency === null) {
          continue
        }

        const dependencyLocation = sourceFileIndex[resolvedDependency]
        if (dependencyLocation === undefined) {
          continue
        }

        if (
          sourceFile.layerName === dependencyLocation.layerName &&
          sourceFile.sliceName !== dependencyLocation.sliceName
        ) {
          if (
            dependencyLocation.sliceName !== null &&
            sourceFile.sliceName !== null &&
            !isCrossImportPublicApi(dependencyLocation.file, {
              inSlice: dependencyLocation.sliceName,
              forSlice: sourceFile.sliceName,
              layerPath: join(root.path, dependencyLocation.layerName),
            })
          ) {
            diagnostics.push({
              message: `Forbidden cross-import from slice "${dependencyLocation.sliceName}".`,
              location: { path: sourceFile.file.path },
            })
          }
        } else {
          const thisLayerIndex = layerSequence.indexOf(sourceFile.layerName)
          const dependencyLayerIndex = layerSequence.indexOf(dependencyLocation.layerName)

          if (thisLayerIndex < dependencyLayerIndex) {
            diagnostics.push({
              message: `Forbidden import from higher layer "${dependencyLocation.layerName}".`,
              location: { path: sourceFile.file.path },
            })
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default forbiddenImports
