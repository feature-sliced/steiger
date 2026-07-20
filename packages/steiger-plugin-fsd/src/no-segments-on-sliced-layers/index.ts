import { basename } from 'node:path'

import { getLayers, isSliced, conventionalSegmentNames } from '@feature-sliced/filesystem'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'
import { NAMESPACE } from '../constants.js'
import type { FsdRuleOptions } from '../fsd-options.js'

const noSegmentsOnSlicedLayers = {
  name: `${NAMESPACE}/no-segments-on-sliced-layers` as const,
  check(root, ruleOptions: FsdRuleOptions = {}) {
    const diagnostics: Array<PartialDiagnostic> = []
    const layers = Object.values(getLayers(root, ruleOptions.layerConvention))

    for (const layer of layers) {
      if (isSliced(layer, ruleOptions.layerConvention)) {
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
} satisfies Rule<unknown, FsdRuleOptions>

export default noSegmentsOnSlicedLayers
