import { join } from 'node:path'
import { getLayers, getSlices, isSliced } from '@feature-sliced/filesystem'
import type { PartialDiagnostic, Rule } from '@steiger/types'

import { groupSlices } from '../_lib/group-slices.js'
import { NAMESPACE } from '../constants.js'

const THRESHOLDS = {
  entities: 20,
  features: 20,
  widgets: 20,
  pages: 20,
}

/** Warn about excessive amounts of ungrouped entities/features/widgets/pages. */
const excessiveSlicing = {
  name: `${NAMESPACE}/excessive-slicing`,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    for (const [layerName, layer] of Object.entries(getLayers(root))) {
      if (!isSliced(layer) || !(layerName in THRESHOLDS)) {
        continue
      }

      const sliceGroups = groupSlices(Object.keys(getSlices(layer)))
      const threshold = THRESHOLDS[layerName as keyof typeof THRESHOLDS]

      for (const [group, slices] of Object.entries(sliceGroups)) {
        if (slices.length <= threshold) {
          continue
        }

        if (group === '') {
          diagnostics.push({
            message: `Layer "${layerName}" has ${slices.length} ungrouped slices, which is above the recommended threshold of ${threshold}. Consider grouping them or moving the code inside to the layer where it's used.`,
            location: { path: layer.path, type: 'folder' },
          })
        } else {
          diagnostics.push({
            message: `Slice group "${group}" has ${slices.length} slices, which is above the recommended threshold of ${threshold}. Consider grouping them or moving the code inside to the layer where it's used.`,
            location: { path: join(layer.path, group), type: 'folder' },
          })
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default excessiveSlicing
