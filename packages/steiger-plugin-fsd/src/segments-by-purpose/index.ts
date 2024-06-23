import { getLayers, getSegments, getSlices, isSliced } from '@feature-sliced/filesystem'
import type { Diagnostic, Rule } from '@steiger/types'

const BAD_NAMES = ['components', 'hooks', 'helpers', 'utils', 'modals', 'types', 'constants', 'consts', 'const']

/** Discourage the use of segment names that group code by its essence, and instead encourage grouping by purpose. */
const segmentsByPurpose = {
  name: 'segments-by-purpose',
  check(root) {
    const diagnostics: Array<Diagnostic> = []

    for (const [layerName, layer] of Object.entries(getLayers(root))) {
      if (layer === null) {
        continue
      }

      if (!isSliced(layer)) {
        for (const segmentName of Object.keys(getSegments(layer))) {
          if (BAD_NAMES.includes(segmentName)) {
            diagnostics.push({ message: `Non-descriptive segment name "${segmentName}" on layer "${layerName}"` })
          }
        }
      } else {
        for (const [sliceName, slice] of Object.entries(getSlices(layer))) {
          for (const segmentName of Object.keys(getSegments(slice))) {
            if (BAD_NAMES.includes(segmentName)) {
              diagnostics.push({
                message: `Non-descriptive segment name "${segmentName}" on slice "${sliceName}" on layer "${layerName}"`,
              })
            }
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default segmentsByPurpose
