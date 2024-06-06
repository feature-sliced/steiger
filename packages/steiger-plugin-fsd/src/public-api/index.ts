import { join } from 'node:path'
import { getLayers, getSegments, isSliced, getIndex, getSlices } from '@feature-sliced/filesystem'

import type { Diagnostic, Rule } from '../types.js'

/** Require slices (or segments on sliceless layers) to have a public API. */
const publicApi = {
  name: 'public-api',
  check(root, context) {
    const diagnostics: Array<Diagnostic> = []

    for (const [layerName, layer] of Object.entries(getLayers(root))) {
      if (!isSliced(layer)) {
        for (const [segmentName, segment] of Object.entries(getSegments(layer))) {
          if (getIndex(segment) === undefined) {
            diagnostics.push({
              message: `On the "${layerName}" layer, segment "${segmentName}" is missing a public API.`,
              fixes: [
                {
                  type: 'create-file',
                  path: join(segment.path, `index.${context.sourceFileExtension}`),
                  // TODO: Infer better content for this file
                  content: '',
                },
              ],
            })
          }
        }
      } else {
        for (const [sliceName, slice] of Object.entries(getSlices(layer))) {
          if (getIndex(slice) === undefined) {
            diagnostics.push({
              message: `On the "${layerName}" layer, slice "${sliceName}" is missing a public API.`,
              fixes: [
                {
                  type: 'create-file',
                  path: join(slice.path, `index.${context.sourceFileExtension}`),
                  // TODO: Infer better content for this file
                  content: '',
                },
              ],
            })
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default publicApi
