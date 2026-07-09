import * as fs from 'node:fs'
import { layerSequence, isCrossImportPublicApi } from '@feature-sliced/filesystem'
import { parse as parseNearestTsConfig } from 'tsconfck'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'

import { indexSourceFiles } from '../_lib/index-source-files.js'
import { collectRelatedTsConfigs } from '../_lib/collect-related-ts-configs.js'
import { resolveDependency } from '../_lib/resolve-dependency.js'
import { extractDependencies, getSourceType } from '../_language-tools/index.js'
import { NAMESPACE } from '../constants.js'
import { getLayerDisplayName, getLayerPath, type FsdRuleOptions } from '../fsd-options.js'

const forbiddenImports = {
  name: `${NAMESPACE}/forbidden-imports` as const,
  async check(root, ruleOptions: FsdRuleOptions = {}) {
    const diagnostics: Array<PartialDiagnostic> = []
    const parseResult = await parseNearestTsConfig(root.children[0]?.path ?? root.path)
    const tsConfigs = collectRelatedTsConfigs(parseResult)
    const sourceFileIndex = indexSourceFiles(root, ruleOptions.layerConvention)

    for (const sourceFile of Object.values(sourceFileIndex)) {
      const sourceType = getSourceType(sourceFile.file.path)
      if (!sourceType) continue

      const dependencies = await extractDependencies(sourceType, fs.readFileSync(sourceFile.file.path, 'utf8'))
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
              layerPath: getLayerPath(root, dependencyLocation.layerName, ruleOptions.layerConvention),
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
              message: `Forbidden import from higher layer "${getLayerDisplayName(root, dependencyLocation.layerName, ruleOptions.layerConvention)}".`,
              location: { path: sourceFile.file.path },
            })
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule<unknown, FsdRuleOptions>

export default forbiddenImports
