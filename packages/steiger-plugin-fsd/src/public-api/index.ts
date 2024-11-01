import { join } from 'node:path'
import { getLayers, getSegments, isSliced, getIndex, getSlices } from '@feature-sliced/filesystem'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'
import { NAMESPACE } from '../constants.js'

/** Require slices (or segments on sliceless layers) to have a public API. */
const publicApi = {
  name: `${NAMESPACE}/public-api` as const,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    for (const [layerName, layer] of Object.entries(getLayers(root))) {
      if (!isSliced(layer)) {
        if (layerName === 'app') {
          // The app layer is the top-level layer, there's no need for public API.
          continue
        }
        for (const [segmentName, segment] of Object.entries(getSegments(layer))) {
          if (getIndex(segment) === undefined) {
            if (!['ui', 'lib'].includes(segmentName)) {
              diagnostics.push({
                message: 'This segment is missing a public API.',
                fixes: [
                  {
                    type: 'create-file',
                    path: join(segment.path, `index.js`),
                    // TODO: Infer better content for this file
                    content: '',
                  },
                ],
                location: { path: segment.path },
              })
            } else if (segment.type === 'folder') {
              for (const child of segment.children) {
                if (child.type === 'folder' && getIndex(child) === undefined) {
                  diagnostics.push({
                    message: `This top-level folder in shared/${segmentName} is missing a public API.`,
                    fixes: [
                      {
                        type: 'create-file',
                        path: join(child.path, `index.js`),
                        content: '',
                      },
                    ],
                    location: { path: child.path },
                  })
                }
              }
            }
          }
        }
      } else {
        for (const slice of Object.values(getSlices(layer))) {
          if (getIndex(slice) === undefined) {
            diagnostics.push({
              message: 'This slice is missing a public API.',
              fixes: [
                {
                  type: 'create-file',
                  path: join(slice.path, `index.js`),
                  // TODO: Infer better content for this file
                  content: '',
                },
              ],
              location: { path: slice.path },
            })
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default publicApi
