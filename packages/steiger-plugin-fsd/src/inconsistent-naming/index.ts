import { join } from 'node:path'
import { partition } from 'lodash-es'
import pluralize from 'pluralize'
const { isPlural, plural, singular } = pluralize
import { getLayers, getSlices } from '@feature-sliced/filesystem'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'

import { groupSlices } from '../_lib/group-slices.js'
import { NAMESPACE } from '../constants.js'

const neutralWords = new Set(['k8s', 'kubernetes', 'media'])

/** Detect inconsistent naming of slices on layers (singular vs plural) */
const inconsistentNaming = {
  name: `${NAMESPACE}/inconsistent-naming` as const,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    const { entities } = getLayers(root)
    if (entities === undefined) {
      return { diagnostics }
    }

    const slices = getSlices(entities)
    const sliceNames = groupSlices(Object.keys(slices))
    for (const [groupPrefix, group] of Object.entries(sliceNames)) {
      const [, namesToCheck] = partition(group, isNeutralWord)
      const [pluralNames, singularNames] = partition(namesToCheck, isPlural)

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
            location: { path: join(entities.path, groupPrefix) },
          })
        } else {
          diagnostics.push({
            message: `${message}. Prefer all singular names`,
            fixes: pluralNames.map((name) => ({
              type: 'rename',
              path: join(entities.path, groupPrefix, name),
              newName: singular(name),
            })),
            location: { path: join(entities.path, groupPrefix) },
          })
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default inconsistentNaming

function isNeutralWord(name: string) {
  return neutralWords.has(name.toLowerCase())
}
