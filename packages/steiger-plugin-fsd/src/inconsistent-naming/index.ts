import { join } from 'node:path'
import { partition } from 'lodash-es'
import pluralize from 'pluralize'
const { isPlural, plural, singular } = pluralize
import { getLayers, getSlices } from '@feature-sliced/filesystem'

import type { Diagnostic, Rule } from '../types.js'
import { groupSlices } from '../_lib/group-slices.js'

/** Detect consistent naming of slices on layers (singular vs plural, casing) */
const inconsistentNaming = {
  name: 'inconsistent-naming',
  check(root) {
    const diagnostics: Array<Diagnostic> = []

    const { entities } = getLayers(root)
    if (entities === undefined) {
      return { diagnostics }
    }

    const slices = getSlices(entities)
    const sliceNames = groupSlices(Object.keys(slices))
    for (const [groupPrefix, group] of Object.entries(sliceNames)) {
      const [pluralNames, singularNames] = partition(group, isPlural)

      if (pluralNames.length > 0 && singularNames.length > 0) {
        let message = `Inconsistent pluralization on layer "entities"`

        if (groupPrefix.length > 0) {
          message += ` for slice group "${groupPrefix}"`
        }

        if (pluralNames.length >= singularNames.length) {
          diagnostics.push({
            message: `${message}. Prefer all plural names`,
            fixes: singularNames.map((name) => ({
              type: 'rename',
              path: join(entities.path, groupPrefix, name),
              newName: plural(name),
            })),
          })
        } else {
          diagnostics.push({
            message: `${message}. Prefer all singular names`,
            fixes: pluralNames.map((name) => ({
              type: 'rename',
              path: join(entities.path, groupPrefix, name),
              newName: singular(name),
            })),
          })
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default inconsistentNaming
