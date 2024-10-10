import { basename } from 'node:path'

import { getLayers, isSliced, conventionalSegmentNames } from '@feature-sliced/filesystem'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'
import { NAMESPACE } from '../constants.js'

const noSegmentsOnSlicedLayers = {
  name: `${NAMESPACE}/no-segments-on-sliced-layers` as const,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []
    const layers = Object.values(getLayers(root))

    for (const layer of layers) {
      if (isSliced(layer)) {
        for (const directChild of layer.children) {
          if (directChild.type === 'folder') {
            const folderName = basename(directChild.path)
            const isConventionalSegment = folderName && conventionalSegmentNames.includes(folderName)

            if (isConventionalSegment) {
              diagnostics.push({
                message: `Conventional segment "${folderName}" should not be a direct child of a sliced layer. Consider moving it inside a slice or, if that is a slice, consider a different name for it to avoid confusion with segments.`,
                location: { path: directChild.path },
              })
            }
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default noSegmentsOnSlicedLayers
