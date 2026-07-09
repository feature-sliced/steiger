import * as fs from 'node:fs'
import { sep, join } from 'node:path'
import { parse as parseNearestTsConfig } from 'tsconfck'
import { isSliced, unslicedLayers, type LayerName } from '@feature-sliced/filesystem'
import type { Folder, PartialDiagnostic, Rule } from '@steiger/toolkit'

import { indexSourceFiles } from '../_lib/index-source-files.js'
import { collectRelatedTsConfigs } from '../_lib/collect-related-ts-configs.js'
import { resolveDependency } from '../_lib/resolve-dependency.js'
import { NAMESPACE } from '../constants.js'
import { extractDependencies, getSourceType } from '../_language-tools/index.js'
import { getLayerDisplayName, type FsdRuleOptions, type LayerConvention } from '../fsd-options.js'

type SliceReferences = Map<
  string,
  {
    sourceLayerName: LayerName
    targetLocations: Map<string, LayerName>
  }
>

const insignificantSlice = {
  name: `${NAMESPACE}/insignificant-slice` as const,
  async check(root, ruleOptions: FsdRuleOptions = {}) {
    const diagnostics: Array<PartialDiagnostic> = []

    const references = await traceSliceReferences(root, ruleOptions.layerConvention)

    for (const [sourceLocationKey, { sourceLayerName, targetLocations }] of references) {
      if (!isSliced(sourceLayerName, ruleOptions.layerConvention) || sourceLayerName === 'pages') {
        continue
      }

      if (targetLocations.size === 1) {
        const [referenceLocationKey, referenceLayerName] = [...targetLocations][0]
        if (unslicedLayers.includes(referenceLayerName)) {
          if (referenceLayerName !== 'app') {
            diagnostics.push({
              message: `This slice has only one reference on layer "${referenceLocationKey}". Consider moving this code to "${referenceLocationKey}".`,
              location: { path: join(root.path, sourceLocationKey) },
            })
          }
        } else {
          diagnostics.push({
            message: `This slice has only one reference in slice "${referenceLocationKey}". Consider merging them.`,
            location: { path: join(root.path, sourceLocationKey) },
          })
        }
      } else if (targetLocations.size === 0) {
        diagnostics.push({
          message: `This slice has no references. Consider removing it.`,
          location: { path: join(root.path, sourceLocationKey) },
        })
      }
    }

    return { diagnostics }
  },
} satisfies Rule<unknown, FsdRuleOptions>

export default insignificantSlice

async function traceSliceReferences(root: Folder, layerConvention?: LayerConvention): Promise<SliceReferences> {
  const sourceFileIndex = indexSourceFiles(root, layerConvention)
  const parseResult = await parseNearestTsConfig(root.children[0]?.path ?? root.path)
  const tsConfigs = collectRelatedTsConfigs(parseResult)
  const references: SliceReferences = new Map()

  for (const sourceFile of Object.values(sourceFileIndex)) {
    const thisFileLocationKey = [getLayerDisplayName(root, sourceFile.layerName, layerConvention), sourceFile.sliceName]
      .filter(Boolean)
      .join(sep)

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
      if (dependencyLocation === undefined || sourceFile.layerName === dependencyLocation.layerName) {
        continue
      }

      const dependencyLocationKey = [
        getLayerDisplayName(root, dependencyLocation.layerName, layerConvention),
        dependencyLocation.sliceName,
      ]
        .filter(Boolean)
        .join(sep)

      if (thisFileLocationKey !== dependencyLocationKey) {
        if (!references.has(dependencyLocationKey)) {
          references.set(dependencyLocationKey, {
            sourceLayerName: dependencyLocation.layerName,
            targetLocations: new Map(),
          })
        }
        references.get(dependencyLocationKey)?.targetLocations.set(thisFileLocationKey, sourceFile.layerName)
      }
    }

    if (!references.has(thisFileLocationKey)) {
      references.set(thisFileLocationKey, {
        sourceLayerName: sourceFile.layerName,
        targetLocations: new Map(),
      })
    }
  }

  return references
}
