import * as fs from 'node:fs'
import { layerSequence } from '@feature-sliced/filesystem'
import precinct from 'precinct'
const { paperwork } = precinct
import { parse as parseNearestTsConfig } from 'tsconfck'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'

import { indexSourceFiles } from '../_lib/index-source-files.js'
import { collectRelatedTsConfigs } from '../_lib/collect-related-ts-configs.js'
import { resolveDependency } from '../_lib/resolve-dependency.js'
import { NAMESPACE } from '../constants.js'

const noHigherLevelImports = {
  name: `${NAMESPACE}/no-higher-level-imports` as const,
  async check(root) {
    const diagnostics: Array<PartialDiagnostic> = []
    const parseResult = await parseNearestTsConfig(root.children[0]?.path ?? root.path)
    const tsConfigs = collectRelatedTsConfigs(parseResult)
    const sourceFileIndex = indexSourceFiles(root)

    for (const sourceFile of Object.values(sourceFileIndex)) {
      const dependencies = paperwork(sourceFile.file.path, { includeCore: false, fileSystem: fs })
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

    return { diagnostics }
  },
} satisfies Rule

export default noHigherLevelImports
