import * as fs from 'node:fs'
import { join } from 'node:path'
import { layerSequence, resolveImport, isCrossImportPublicApi } from '@feature-sliced/filesystem'
import precinct from 'precinct'
const { paperwork } = precinct
import { parse as parseNearestTsConfig } from 'tsconfck'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'

import { indexSourceFiles } from '../_lib/index-source-files.js'
import { NAMESPACE } from '../constants.js'

const forbiddenImports = {
  name: `${NAMESPACE}/forbidden-imports` as const,
  async check(root) {
    const diagnostics: Array<PartialDiagnostic> = []
    const { tsconfig } = await parseNearestTsConfig(root.path)
    const sourceFileIndex = indexSourceFiles(root)

    for (const sourceFile of Object.values(sourceFileIndex)) {
      const dependencies = paperwork(sourceFile.file.path, { includeCore: false, fileSystem: fs })
      for (const dependency of dependencies) {
        const resolvedDependency = resolveImport(
          dependency,
          sourceFile.file.path,
          tsconfig?.compilerOptions ?? {},
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
