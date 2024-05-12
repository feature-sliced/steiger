import type { Diagnostic, Rule } from '../types'

const BAD_NAMES = ['components', 'hooks', 'helpers', 'utils', 'modals']

function formatError(segmentName: string) {
  return { message: `Non-descriptive segment name: ${segmentName}` }
}

/** Discourage the use of segment names that group code by its essence, and instead encourage grouping by purpose. */
const segmentsByPurpose = {
  name: 'segments-by-purpose',
  check(root) {
    const diagnostics: Array<Diagnostic> = []

    for (const layer of Object.values(root.layers)) {
      if (layer === null) {
        continue
      }

      if (layer.type === 'unsliced-layer') {
        for (const segment of Object.values(layer.segments)) {
          if (BAD_NAMES.includes(segment.name)) {
            diagnostics.push(formatError(segment.name))
          }
        }
      } else {
        for (const slice of Object.values(layer.slices)) {
          for (const segment of Object.values(slice.segments)) {
            if (BAD_NAMES.includes(segment.name)) {
              diagnostics.push(formatError(segment.name))
            }
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default segmentsByPurpose
