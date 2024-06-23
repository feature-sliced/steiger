import * as fs from 'node:fs'
import { relative, join } from 'node:path'
import { layerSequence, resolveImport } from '@feature-sliced/filesystem'
import precinct from 'precinct'
const { paperwork } = precinct
import { parse as parseNearestTsConfig } from 'tsconfck'
import type { Diagnostic, Rule } from '@steiger/types'

import { indexSourceFiles } from '../_lib/index-source-files.js'

const forbiddenImports = {
  name: 'forbidden-imports',
  async check(root) {
    const diagnostics: Array<Diagnostic> = []
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
          const relativePath = relative(join(root.path, sourceFile.layerName), sourceFile.file.path)
          if (dependencyLocation.sliceName === null) {
            diagnostics.push({
              message: `Forbidden cross-import on layer "${dependencyLocation.layerName}" from "${relativePath}" to segment "${dependencyLocation.segmentName}".`,
            })
          } else {
            diagnostics.push({
              message: `Forbidden cross-import on layer "${dependencyLocation.layerName}" from "${relativePath}" to slice "${dependencyLocation.sliceName}".`,
            })
          }
        } else {
          const thisLayerIndex = layerSequence.indexOf(sourceFile.layerName)
          const dependencyLayerIndex = layerSequence.indexOf(dependencyLocation.layerName)

          if (thisLayerIndex < dependencyLayerIndex) {
            diagnostics.push({
              message: `Forbidden import from "${relative(root.path, sourceFile.file.path)}" to higher layer "${dependencyLocation.layerName}".`,
            })
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default forbiddenImports
