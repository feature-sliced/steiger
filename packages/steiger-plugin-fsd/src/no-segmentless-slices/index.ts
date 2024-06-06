import { basename, relative } from 'node:path'
import {
  conventionalSegmentNames,
  getAllSlices,
  getLayers,
  getSegments,
  isSlice,
  isSliced,
  type Folder,
} from '@feature-sliced/filesystem'

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
        const isSliceGroup =
          sliceCandidate.children.length > 0 &&
          sliceCandidate.children.every((child) => child.type === 'folder' && !isSlice(child))

        if (isSliceGroup) {
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
