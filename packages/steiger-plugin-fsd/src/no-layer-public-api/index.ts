import { getIndex, getLayers } from '@feature-sliced/filesystem'
import type { PartialDiagnostic, Rule } from '@steiger/types'
import { NAMESPACE } from '../constants.js'

/** Layers that are allowed to have an index file. */
const exceptionLayers = ['app']

/** Forbid index files on layer level. */
const noLayerPublicApi = {
  name: `${NAMESPACE}/no-layer-public-api`,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    for (const [layerName, layer] of Object.entries(getLayers(root))) {
      const index = getIndex(layer)
      const notAmongExceptions = !exceptionLayers.includes(layerName)

      if (notAmongExceptions && index !== undefined) {
        diagnostics.push({
          message: `Layer "${layerName}" should not have an index file`,
          location: { path: index.path, type: 'file' },
        })
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default noLayerPublicApi
