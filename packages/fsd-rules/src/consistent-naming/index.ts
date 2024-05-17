import { join } from 'node:path'
import { partition } from 'lodash-es'
import { isPlural, plural, singular } from 'pluralize'
import { isSliced, getLayers, getSlices } from '@feature-sliced/filesystem'

import type { Diagnostic, Rule } from '../types.js'
import { groupSlices } from '../_lib/group-slices.js'

/** Detect consistent naming of slices on layers (singular vs plural, casing) */
const consistentNaming = {
  name: 'consistent-naming',
  check(root) {
    const diagnostics: Array<Diagnostic> = []

    for (const [layerName, layer] of Object.entries(getLayers(root))) {
      if (!isSliced(layer)) {
        continue
      }

      const slices = getSlices(layer)
      const sliceNames = groupSlices(Object.keys(slices))
      for (const [groupPrefix, group] of Object.entries(sliceNames)) {
        const [pluralNames, singularNames] = partition(group, isPlural)

        if (pluralNames.length > 0 && singularNames.length > 0) {
          let message = `Inconsistent pluralization on layer "${layerName}"`

          if (groupPrefix.length > 0) {
            message += ` for slice group "${groupPrefix}"`
          }

          if (pluralNames.length >= singularNames.length) {
            diagnostics.push({
              message: `${message}. Prefer all plural names`,
              fixes: singularNames.map((name) => ({
                type: 'rename',
                path: join(layer.path, groupPrefix, name),
                newName: plural(name),
              })),
            })
          } else {
            diagnostics.push({
              message: `${message}. Prefer all singular names`,
              fixes: pluralNames.map((name) => ({
                type: 'rename',
                path: join(layer.path, groupPrefix, name),
                newName: singular(name),
              })),
            })
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default consistentNaming
