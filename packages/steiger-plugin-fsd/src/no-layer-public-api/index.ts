import { getIndex, getLayers } from '@feature-sliced/filesystem'
import type { Diagnostic, Rule } from '@steiger/types'

/** Forbid index files on layer level. */
const noLayerPublicApi = {
  name: 'no-layer-public-api',
  check(root) {
    const diagnostics: Array<Diagnostic> = []

    for (const [layerName, layer] of Object.entries(getLayers(root))) {
      const index = getIndex(layer)
      if (index !== undefined) {
        diagnostics.push({
          message: `Layer "${layerName}" should not have an index file`,
          location: { path: index.path },
        })
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default noLayerPublicApi
