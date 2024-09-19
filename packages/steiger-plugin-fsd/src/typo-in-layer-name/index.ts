import type { Diagnostic, Rule } from '@steiger/types'
import { NAMESPACE } from '../constants.js'
import { layerSequence } from '@feature-sliced/filesystem'
import { closest } from 'fastest-levenshtein'
import { basename } from 'node:path'

const typoInLayerName = {
  name: `${NAMESPACE}/typo-in-layer-name`,
  check(root) {
    const diagnostics: Array<Diagnostic> = []

    root.children.forEach((child) => {
      if (child.type === 'folder') {
        const layer = basename(child.path)
        const closestLayer = closest(layer, layerSequence)

        if (layer !== closestLayer) {
          diagnostics.push({
            message: `Layer "${layer}" potentially contains a typo. Did you mean "${closestLayer}"?`,
            location: { path: child.path },
          })
        }
      }
    })

    return { diagnostics }
  },
} satisfies Rule

export default typoInLayerName
