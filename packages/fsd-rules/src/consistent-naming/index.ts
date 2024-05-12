import { partition } from 'lodash-es'
import { isPlural, plural, singular } from 'pluralize'

import type { Diagnostic, Rule } from '../types'

/** Detect consistent naming of slices on layers (singular vs plural, casing) */
const consistentNaming = {
  name: 'consistent-naming',
  check(root) {
    const diagnostics: Array<Diagnostic> = []

    for (const layer of Object.values(root.layers)) {
      if (layer === null || layer.type === 'unsliced-layer') {
        continue
      }

      const sliceNames = Object.keys(layer.slices)
      const [pluralNames, singularNames] = partition(sliceNames, isPlural)

      if (pluralNames.length > 0 && singularNames.length > 0) {
        if (pluralNames.length >= singularNames.length) {
          diagnostics.push({
            message: `Inconsistent pluralization on layer "${layer.name}". Prefer all plural names`,
            fixes: singularNames.map((name) => ({
              type: 'rename',
              path: layer.slices[name].path,
              newName: plural(name),
            })),
          })
        } else {
          diagnostics.push({
            message: `Inconsistent pluralization on layer "${layer.name}". Prefer all singular names`,
            fixes: pluralNames.map((name) => ({
              type: 'rename',
              path: layer.slices[name].path,
              newName: singular(name),
            })),
          })
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default consistentNaming
