import { getLayers, getSegments, getSlices, isSliced } from '@feature-sliced/filesystem'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'
import { NAMESPACE } from '../constants.js'

const BAD_NAMES = ['components', 'hooks', 'helpers', 'utils', 'modals', 'types', 'constants', 'consts', 'const']

/** Discourage the use of segment names that group code by its essence, and instead encourage grouping by purpose. */
const segmentsByPurpose = {
  name: `${NAMESPACE}/segments-by-purpose` as const,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    for (const layer of Object.values(getLayers(root))) {
      if (layer === null) {
        continue
      }

      if (!isSliced(layer)) {
        for (const [segmentName, segment] of Object.entries(getSegments(layer))) {
          if (BAD_NAMES.includes(segmentName)) {
            diagnostics.push({
              message: "This segment's name should describe the purpose of its contents, not what the contents are.",
              location: { path: segment.path },
            })
          }
        }
      } else {
        for (const slice of Object.values(getSlices(layer))) {
          for (const [segmentName, segment] of Object.entries(getSegments(slice))) {
            if (BAD_NAMES.includes(segmentName)) {
              diagnostics.push({
                message: "This segment's name should describe the purpose of its contents, not what the contents are.",
                location: { path: segment.path },
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
