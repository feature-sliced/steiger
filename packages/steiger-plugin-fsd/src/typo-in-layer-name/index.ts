import type { PartialDiagnostic, Rule } from '@steiger/types'
import { NAMESPACE } from '../constants.js'
import { LayerName, layerSequence } from '@feature-sliced/filesystem'
import { distance } from 'fastest-levenshtein'
import { basename } from 'node:path'
import { joinFromRoot } from '../_lib/prepare-test.js'

const LEVENSHTEIN_DISTANCE_UPPER_BOUND = 3

const typoInLayerName = {
  name: `${NAMESPACE}/typo-in-layer-name`,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    // construct list of suggestions, like [{ input: 'shraed', suggestion: 'shared', distance: 2 }, ...],
    // limit Levenshtein distance upper bound to 3,
    // sort by Levenshtein distance in ascending order,
    const suggestionsList = root.children
      .filter((child) => child.type === 'folder')
      .flatMap((child) => {
        const layer = basename(child.path)

        return layerSequence
          .map((sequenceLayer) => ({
            input: layer,
            suggestion: sequenceLayer,
            distance: distance(layer, sequenceLayer),
          }))
          .filter((layer) => layer.distance <= LEVENSHTEIN_DISTANCE_UPPER_BOUND)
      })
      .sort((a, b) => a.distance - b.distance)

    const processedInputs: string[] = []
    const suggestedLayers: LayerName[] = []

    suggestionsList.forEach((layer) => {
      // if Levenshtein distance is 0, the layer name is correct - add it as a "suggestion"
      if (layer.distance === 0) {
        suggestedLayers.push(layer.suggestion)

        return
      }

      // if the input is already processed, the suggestion for this input is already added
      if (processedInputs.includes(layer.input)) {
        return
      }

      // if the suggestion is already added, it cannot be used for this input
      if (suggestedLayers.includes(layer.suggestion)) {
        return
      }

      // mark the input as processed & add suitable suggestion
      processedInputs.push(layer.input)
      suggestedLayers.push(layer.suggestion)

      diagnostics.push({
        message: `Layer "${layer.input}" potentially contains a typo. Did you mean "${layer.suggestion}"?`,
        location: { path: joinFromRoot(layer.input) },
      })
    })

    return { diagnostics }
  },
} satisfies Rule

export default typoInLayerName
