import { getLayers, isSlice, isSliced } from '@feature-sliced/filesystem'
import type { Folder, PartialDiagnostic, Rule } from '@steiger/toolkit'
import type { FSDPluginOptions } from '../_lib/plugin-options.js'
import { NAMESPACE } from '../constants.js'

const noSegmentlessSlices = {
  name: `${NAMESPACE}/no-segmentless-slices` as const,
  check(root, _ruleOptions?: unknown, { additionalSegments = [] }: FSDPluginOptions = {}) {
    const diagnostics: Array<PartialDiagnostic> = []

    for (const layer of Object.values(getLayers(root))) {
      if (!isSliced(layer)) {
        continue
      }

      let sliceCandidates = layer.children.filter((child) => child.type === 'folder') as Array<Folder>
      while (sliceCandidates.length > 0) {
        const sliceCandidate = sliceCandidates.pop()
        if (sliceCandidate === undefined) {
          continue
        }

        // A folder inside a layer can either be a slice or a group of slices
        if (isSliceGroup(sliceCandidate, additionalSegments)) {
          sliceCandidates = sliceCandidates.concat(sliceCandidate.children as Array<Folder>)
        } else {
          if (!isSlice(sliceCandidate, additionalSegments)) {
            diagnostics.push({
              message: 'This slice has no segments. Consider dividing the code inside into segments.',
              location: { path: sliceCandidate.path },
            })
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default noSegmentlessSlices

/** A slice group is a folder that contains only folders, and those folders are either slices or slice groups. */
function isSliceGroup(folder: Folder, additionalSegments: Array<string>): boolean {
  return (
    folder.children.length > 0 &&
    !isSlice(folder, additionalSegments) &&
    folder.children.every(
      (child) =>
        child.type === 'folder' &&
        (isSlice(child, additionalSegments) ||
          child.children.every((grandchild) => grandchild.type === 'file') ||
          isSliceGroup(child, additionalSegments)),
    )
  )
}
