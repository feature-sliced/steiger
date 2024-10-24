import { join } from 'node:path'
import { getLayers, getSlices, isSliced } from '@feature-sliced/filesystem'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'

import { NAMESPACE } from '../constants.js'
import { groupSlices } from '../_lib/group-slices.js'

/**
 * Pattern that matches one word in different naming conventions.
 *
 * For example, it separately matches "test", "name", and "this" in the following strings:
 *  - TestNameThis
 *  - testNameThis
 *  - test_name_this
 *  - test-name-this
 *  - TEST_NAME_THIS
 */
const wordPattern = /(?:[A-Z]+|[a-z]+)[a-z]*/g

/** Warn about repetitive parts in slice names (e.g. adding page to every slice on Pages) */
const repetitiveNaming = {
  name: `${NAMESPACE}/repetitive-naming` as const,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    for (const layer of Object.values(getLayers(root))) {
      if (!isSliced(layer)) {
        continue
      }

      const sliceGroups = groupSlices(Object.keys(getSlices(layer)))

      for (const [group, sliceNames] of Object.entries(sliceGroups)) {
        const wordsInSliceNames = sliceNames.map((name) =>
          (name.match(wordPattern) ?? <Array<string>>[]).map((word) => word.toLowerCase()),
        )
        const mostCommonWords = wordsInSliceNames.flat().reduce((acc, word) => {
          acc.set(word, (acc.get(word) ?? 0) + 1)
          return acc
        }, new Map<string, number>())

        for (const [word, count] of mostCommonWords.entries()) {
          if (
            sliceNames.length > 2 &&
            count >= sliceNames.length &&
            wordsInSliceNames.every((words) => words.includes(word))
          ) {
            diagnostics.push({
              message: `Repetitive word "${word}" in slice names.`,
              location: { path: join(layer.path, group) },
            })
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default repetitiveNaming
