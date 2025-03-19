import { getIndexes, getLayers } from '@feature-sliced/filesystem'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'
import { NAMESPACE } from '../constants.js'

/** Layers that are allowed to have an index file. */
const exceptionLayers = ['app']

/** Forbid index files on layer level. */
const noLayerPublicApi = {
  name: `${NAMESPACE}/no-layer-public-api` as const,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    for (const [layerName, layer] of Object.entries(getLayers(root))) {
      const indexes = getIndexes(layer)
      const notAmongExceptions = !exceptionLayers.includes(layerName)

      if (notAmongExceptions) {
        for (const index of indexes) {
          diagnostics.push({
            message: `Layer "${layerName}" should not have an index file`,
            location: { path: index.path },
          })
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default noLayerPublicApi
