import * as fs from 'node:fs'
import { sep, join } from 'node:path'
import { parse as parseNearestTsConfig } from 'tsconfck'
import { isSliced, resolveImport, unslicedLayers, type LayerName } from '@feature-sliced/filesystem'
import type { Folder, PartialDiagnostic, Rule } from '@steiger/toolkit'
import precinct from 'precinct'
const { paperwork } = precinct

import { indexSourceFiles } from '../_lib/index-source-files.js'
import { NAMESPACE } from '../constants.js'

const insignificantSlice = {
  name: `${NAMESPACE}/insignificant-slice` as const,
  async check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    const references = await traceSliceReferences(root)

    for (const [sourceLocationKey, targetLocationKeys] of references) {
      const [sourceLayerName] = sourceLocationKey.split(sep, 2) as [LayerName, string | undefined]
      if (!isSliced(sourceLayerName) || sourceLayerName === 'pages') {
        continue
      }

      if (targetLocationKeys.size === 1) {
        const referenceLocationKey = [...targetLocationKeys][0]
        if (unslicedLayers.includes(referenceLocationKey)) {
          diagnostics.push({
            message: `This slice has only one reference on layer "${referenceLocationKey}". Consider moving this code to "${referenceLocationKey}".`,
            location: { path: join(root.path, sourceLocationKey) },
          })
        } else {
          diagnostics.push({
            message: `This slice has only one reference in slice "${referenceLocationKey}". Consider merging them.`,
            location: { path: join(root.path, sourceLocationKey) },
          })
        }
      } else if (targetLocationKeys.size === 0) {
        diagnostics.push({
          message: `This slice has no references. Consider removing it.`,
          location: { path: join(root.path, sourceLocationKey) },
        })
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default insignificantSlice

async function traceSliceReferences(root: Folder) {
  const sourceFileIndex = indexSourceFiles(root)
  const { tsconfig } = await parseNearestTsConfig(root.path)
  const references = new Map<string, Set<string>>()

  for (const sourceFile of Object.values(sourceFileIndex)) {
    const thisFileLocationKey = [sourceFile.layerName, sourceFile.sliceName].filter(Boolean).join(sep)

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

      const dependencyLocationKey = [dependencyLocation.layerName, dependencyLocation.sliceName]
        .filter(Boolean)
        .join(sep)

      if (thisFileLocationKey !== dependencyLocationKey) {
        if (!references.has(dependencyLocationKey)) {
          references.set(dependencyLocationKey, new Set())
        }
        references.get(dependencyLocationKey)?.add(thisFileLocationKey)
      }
    }

    if (!references.has(thisFileLocationKey)) {
      references.set(thisFileLocationKey, new Set())
    }
  }

  return references
}
