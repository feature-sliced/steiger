import { sep } from 'node:path'
import { getAllSlices, getLayers, getSegments } from '@feature-sliced/filesystem'
import type { Diagnostic, Rule } from '@steiger/types'

/** Forbid slice names that match some segment’s name in shared (e.g., theme, i18n) */
const ambiguousSliceNames = {
  name: 'ambiguous-slice-names',
  check(root) {
    const diagnostics: Array<Diagnostic> = []

    const layers = getLayers(root)
    const sharedLayer = layers.shared

    if (sharedLayer === undefined) {
      return { diagnostics }
    }

    const segmentNamesInShared = Object.keys(getSegments(sharedLayer))

    for (const [sliceName, slice] of Object.entries(getAllSlices(root))) {
      const pathSegments = sliceName.split(sep)
      const matchingSegment = segmentNamesInShared.find((segmentName) => pathSegments.includes(segmentName))
      if (matchingSegment !== undefined) {
        if (matchingSegment === sliceName) {
          diagnostics.push({
            message: `Slice name "${sliceName}" on layer "${slice.layerName}" is ambiguous with a segment name in Shared`,
          })
        } else {
          diagnostics.push({
            message: `Slice name "${sliceName}" on layer "${slice.layerName}" is ambiguous with a segment name "${matchingSegment}" in Shared`,
          })
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default ambiguousSliceNames
