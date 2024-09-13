import { join } from 'node:path'
import { partition } from 'lodash-es'
import pluralize from 'pluralize'
const { isPlural, plural, singular } = pluralize
import { getLayers, getSlices } from '@feature-sliced/filesystem'
import type { PartialDiagnostic, Rule } from '@steiger/types'

import { groupSlices } from '../_lib/group-slices.js'
import { NAMESPACE } from '../constants.js'

/** Detect inconsistent naming of slices on layers (singular vs plural) */
const inconsistentNaming = {
  name: `${NAMESPACE}/inconsistent-naming`,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    const { entities } = getLayers(root)
    if (entities === undefined) {
      return { diagnostics }
    }

    const slices = getSlices(entities)
    const sliceNames = groupSlices(Object.keys(slices))
    for (const [groupPrefix, group] of Object.entries(sliceNames)) {
      const [pluralNames, singularNames] = partition(group, isPlural)

      if (pluralNames.length > 0 && singularNames.length > 0) {
        const message = 'Inconsistent pluralization of slice names'

        if (pluralNames.length >= singularNames.length) {
          diagnostics.push({
            message: `${message}. Prefer all plural names`,
            fixes: singularNames.map((name) => ({
              type: 'rename',
              path: join(entities.path, groupPrefix, name),
              newName: plural(name),
            })),
            location: { path: join(entities.path, groupPrefix), type: 'folder' },
          })
        } else {
          diagnostics.push({
            message: `${message}. Prefer all singular names`,
            fixes: pluralNames.map((name) => ({
              type: 'rename',
              path: join(entities.path, groupPrefix, name),
              newName: singular(name),
            })),
            location: { path: join(entities.path, groupPrefix), type: 'folder' },
          })
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default inconsistentNaming
