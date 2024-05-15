import { join } from 'node:path'
import { globbyStream } from 'globby'
import { paperwork } from 'precinct'

import type { Diagnostic, Rule } from '../types'
import { locateInFsdRoot, type LayerName } from '@feature-sliced/filesystem'

const forbiddenImports = {
  name: 'forbidden-imports',
  async check(root, context) {
    const diagnostics: Array<Diagnostic> = []

    for (const layer of Object.values(root.layers)) {
      if (layer === null) {
        continue
      }

      if (layer.type === 'unsliced-layer') {
        for (const segment of Object.values(layer.segments)) {
          await crawlSubtree(segment.path, context.include, diagnostics)
        }
      } else {
        for (const slice of Object.values(layer.slices)) {
          for (const segment of Object.values(slice.segments)) {
            await crawlSubtree(segment.path, context.include, diagnostics)
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

async function crawlSubtree(subtreePath: string, include: Array<string>, diagnostics: Array<Diagnostic>) {
  for await (const path of globbyStream(include, { cwd: subtreePath })) {
    if (typeof path !== 'string') {
      continue
    }

    const fullPath = join(subtreePath, path)
    const thisFileLocation = locateInFsdRoot(fullPath)
    if (thisFileLocation === null) {
      continue
    }

    const dependencies = paperwork(fullPath, { includeCore: false })
    for (const dependency of dependencies) {
      const dependencyLocation = locateInFsdRoot(dependency)
      if (dependencyLocation === null) {
        continue
      }

      if (thisFileLocation.fsdRoot === dependencyLocation.fsdRoot) {
        if (
          thisFileLocation.layer === dependencyLocation.layer &&
          thisFileLocation.slice !== dependencyLocation.slice
        ) {
          diagnostics.push({
            message: `Forbidden cross-import from "${fullPath}" to slice "${dependencyLocation.slice}" on layer "${thisFileLocation.layer}".`,
          })
        } else {
          const thisLayerIndex = layerSequence.indexOf(thisFileLocation.layer)
          const dependencyLayerIndex = layerSequence.indexOf(dependencyLocation.layer)

          if (thisLayerIndex < dependencyLayerIndex) {
            diagnostics.push({
              message: `Forbidden import from "${fullPath}" to higher layer "${dependencyLocation.layer}".`,
            })
          }
        }
      }
    }
  }
}

const layerSequence: Array<LayerName> = ["shared", "entities", "features", "widgets", "pages", "app"]
