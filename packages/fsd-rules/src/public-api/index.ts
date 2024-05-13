import { join } from 'node:path'

import type { Diagnostic, Rule } from '../types'

/** Require slices (or segments on sliceless layers) to have a public API. */
const publicApi = {
  name: 'public-api',
  check(root, context) {
    const diagnostics: Array<Diagnostic> = []

    for (const layer of Object.values(root.layers)) {
      if (layer === null) {
        continue
      }

      if (layer.type === 'unsliced-layer') {
        for (const segment of Object.values(layer.segments)) {
          if (segment.index === null) {
            diagnostics.push({
              message: `On the "${layer.name}" layer, segment "${segment.name}" is missing a public API.`,
              fixes: [
                {
                  type: 'create-file',
                  path: join(segment.path, `index.${context.isTypeScript ? 'ts' : 'js'}`),
                  // TODO: Infer better content for this file
                  content: '',
                },
              ],
            })
          }
        }
      } else {
        for (const slice of Object.values(layer.slices)) {
          if (slice.index === null) {
            diagnostics.push({
              message: `On the "${layer.name}" layer, slice "${slice.name}" is missing a public API.`,
              fixes: [
                {
                  type: 'create-file',
                  path: join(slice.path, `index.${context.isTypeScript ? 'ts' : 'js'}`),
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
