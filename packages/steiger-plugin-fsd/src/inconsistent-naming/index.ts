import { join } from 'node:path'
import { partition } from 'lodash-es'
import pluralize from 'pluralize'
const { isPlural, plural, singular } = pluralize
import { getLayers, getSlices } from '@feature-sliced/filesystem'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'

import { groupSlices } from '../_lib/group-slices.js'
import { NAMESPACE } from '../constants.js'
import { getMainSubject } from './get-main-subject.js'

/** Detect inconsistent pluralization of entities. */
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
      const [pluralNames, singularNames] = partition(
        group
          .map((name) => [name, getMainSubject(name)] as const)
          .filter(([, mainSubject]) => !isUncountable(mainSubject)),
        ([, mainSubject]) => isPlural(mainSubject),
      )

      /** Names that exist in both singular and plural forms for filtering later. */
      const duplicates = {
        singular: [] as Array<string>,
        plural: [] as Array<string>,
      }

      if (pluralNames.length > 0 && singularNames.length > 0) {
        for (const [singularName, mainSubject] of singularNames) {
          const pluralized = singularName.replace(mainSubject, plural(mainSubject))
          if (group.includes(pluralized)) {
            duplicates.singular.push(singularName)
            duplicates.plural.push(pluralized)

            diagnostics.push({
              message: `Avoid having both "${singularName}" and "${plural(singularName)}" entities${groupPrefix === '' ? '' : ' in the same slice group'}.`,
              location: { path: join(entities.path, groupPrefix, singularName) },
            })
          }
        }

        const message = 'Inconsistent pluralization of entity names'
        if (pluralNames.length > singularNames.length && singularNames.length > duplicates.singular.length) {
          diagnostics.push({
            message: `${message}. Prefer all plural names.`,
            fixes: singularNames
              .filter(([name]) => !duplicates.singular.includes(name))
              .map(([name, mainWord]) => ({
                type: 'rename',
                path: join(entities.path, groupPrefix, name),
                newName: name.replace(mainWord, plural(mainWord)),
              })),
            location: { path: join(entities.path, groupPrefix) },
          })
        } else if (pluralNames.length > duplicates.plural.length) {
          diagnostics.push({
            message: `${message}. Prefer all singular names.`,
            fixes: pluralNames
              .filter(([name]) => !duplicates.plural.includes(name))
              .map(([name, mainWord]) => ({
                type: 'rename',
                path: join(entities.path, groupPrefix, name),
                newName: name.replace(mainWord, singular(mainWord)),
              })),
            location: { path: join(entities.path, groupPrefix) },
          })
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

function isUncountable(word: string) {
  return singular(word) === plural(word)
}

export default inconsistentNaming
