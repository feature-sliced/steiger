import type { Diagnostic, Rule } from '../types'

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
  name: 'repetitive-naming',
  check(root) {
    const diagnostics: Array<Diagnostic> = []

    for (const layer of Object.values(root.layers)) {
      if (layer === null || layer.type === 'unsliced-layer') {
        continue
      }

      const sliceNames = Object.keys(layer.slices)
      const wordsInSliceNames = sliceNames.map((name) =>
        (name.match(wordPattern) ?? <Array<string>>[]).map((word) => word.toLowerCase()),
      )
      const mostCommonWords = wordsInSliceNames.flat().reduce((acc, word) => {
        acc.set(word, (acc.get(word) ?? 0) + 1)
        return acc
      }, new Map<string, number>())

      for (const [word, count] of mostCommonWords.entries()) {
        if (count >= sliceNames.length && wordsInSliceNames.every((words) => words.includes(word))) {
          diagnostics.push({ message: `Repetitive word "${word}" in slice names on layer "${layer.name}"` })
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default repetitiveNaming
