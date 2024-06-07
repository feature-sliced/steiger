import { relative } from 'node:path'
import { getLayers, isSlice, isSliced, type Folder } from '@feature-sliced/filesystem'

import type { Diagnostic, Rule } from '../types.js'

const noSegmentlessSlices = {
  name: 'no-segmentless-slices',
  check(root) {
    const diagnostics: Array<Diagnostic> = []

    for (const [layerName, layer] of Object.entries(getLayers(root))) {
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
        if (isSliceGroup(sliceCandidate)) {
          sliceCandidates = sliceCandidates.concat(sliceCandidate.children as Array<Folder>)
        } else {
          // The slice detection algorithm relies on the presence of a conventional segment
          if (!isSlice(sliceCandidate)) {
            diagnostics.push({
              message: `Slice "${relative(layer.path, sliceCandidate.path)}" on layer "${layerName}" has no segments`,
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
function isSliceGroup(folder: Folder): boolean {
  return (
    folder.children.length > 0 &&
    !isSlice(folder) &&
    folder.children.every(
      (child) =>
        child.type === 'folder' &&
        (isSlice(child) || child.children.every((grandchild) => grandchild.type === 'file') || isSliceGroup(child)),
    )
  )
}
