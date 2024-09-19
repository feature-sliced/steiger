import { basename, sep } from 'node:path'
import { getAllSlices, getLayers, getSegments, type LayerName } from '@feature-sliced/filesystem'
import type { PartialDiagnostic, Folder, Rule } from '@steiger/types'
import { NAMESPACE } from '../constants.js'

/** Forbid slice names that match some segment’s name in shared (e.g., theme, i18n) */
const ambiguousSliceNames = {
  name: `${NAMESPACE}/ambiguous-slice-names`,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    const layers = getLayers(root)
    const sharedLayer = layers.shared

    if (sharedLayer === undefined) {
      return { diagnostics }
    }

    const segmentNamesInShared = Object.keys(getSegments(sharedLayer))

    for (const [sliceName, slice] of Object.entries(getAllSlices(root))) {
      const pathSegments = sliceName.split(sep)
      const matchingSegment = segmentNamesInShared.find((segmentName) => pathSegments.includes(segmentName))

      if (matchingSegment === undefined) {
        continue
      }

      if (matchingSegment === sliceName) {
        diagnostics.push({
          message: `Slice "${sliceName}" could be confused with a segment from Shared with the same name`,
          location: { path: slice.path },
        })
        continue
      }

      const segmentIndex = pathSegments.indexOf(matchingSegment)
      const isGroup = segmentIndex < pathSegments.length - 1
      if (!isGroup) {
        diagnostics.push({
          message: `Slice "${sliceName}" could be confused with a segment "${matchingSegment}" from Shared`,
          location: { path: slice.path },
        })
      } else {
        const layer = layers[slice.layerName as LayerName]
        if (layer === undefined) {
          continue
        }

        const pathSegmentsToGroup = pathSegments.slice(0, segmentIndex + 1)

        const group = pathSegmentsToGroup.reduce<Folder | undefined>(
          (folder, segmentName) =>
            folder?.children.find((child) => child.type === 'folder' && basename(child.path) === segmentName) as
              | Folder
              | undefined,
          layer,
        )

        if (group !== undefined) {
          diagnostics.push({
            message: `Slice group "${pathSegmentsToGroup.join(sep)}" could be confused with a segment "${matchingSegment}" from Shared`,
            location: { path: group.path },
          })
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default ambiguousSliceNames
