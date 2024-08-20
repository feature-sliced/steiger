import { basename } from 'node:path'
import { getLayers, getSlices, isSliced } from '@feature-sliced/filesystem'
import type { Diagnostic, Rule } from '@steiger/toolkit'
import { NAMESPACE } from '../constants.js'

const noFileSegments = {
  name: `${NAMESPACE}/no-file-segments`,
  check(root) {
    const diagnostics: Array<Diagnostic> = []

    for (const layer of Object.values(getLayers(root))) {
      if (!isSliced(layer)) {
        for (const child of layer.children) {
          if (child.type === 'file') {
            diagnostics.push({
              message: 'This segment is a file. Prefer folder segments.',
              location: { path: child.path },
            })
          }
        }
      } else {
        for (const slice of Object.values(getSlices(layer))) {
          for (const child of slice.children) {
            if (child.type === 'file' && withoutExtension(basename(child.path)) !== 'index') {
              diagnostics.push({
                message: 'This segment is a file. Prefer folder segments.',
                location: { path: child.path },
              })
            }
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default noFileSegments

/**
 * Cut away one layer of extension from a filename.
 *
 * @example
 * withoutExtension("index.tsx") // "index"
 * withoutExtension("index.spec.tsx") // "index.spec"
 * withoutExtension("index") // "index"
 */
function withoutExtension(filename: string) {
  const lastDotIndex = filename.lastIndexOf('.')
  return lastDotIndex === -1 ? filename : filename.slice(0, lastDotIndex)
}
