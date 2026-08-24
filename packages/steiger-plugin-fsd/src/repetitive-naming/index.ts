import { join } from 'node:path'
import { getLayers, getSlices, isSliced } from '@feature-sliced/filesystem'
import { parse as parseNearestTsConfig } from 'tsconfck'
import type { Fix, Folder, PartialDiagnostic, Rule } from '@steiger/toolkit'

import { NAMESPACE } from '../constants.js'
import { groupSlices } from '../_lib/group-slices.js'
import { collectRelatedTsConfigs } from '../_lib/collect-related-ts-configs.js'
import { wordsIn } from './slice-name-words.js'
import { discardAmbiguousPlans, planRenames, type RepetitiveWordCandidate, type SliceRename } from './plan-renames.js'
import { planReferenceEdits } from './plan-reference-edits.js'

/** Warn about repetitive parts in slice names (e.g. adding page to every slice on Pages) */
const repetitiveNaming = {
  name: `${NAMESPACE}/repetitive-naming` as const,
  async check(root) {
    const candidates = detectRepetitiveWords(root)

    if (candidates.length === 0) {
      return { diagnostics: [] }
    }

    const fixesByCandidate = await planFixes(root, candidates)

    return {
      diagnostics: candidates.map((candidate): PartialDiagnostic => {
        const fixes = fixesByCandidate.get(candidate)

        return {
          message: `Repetitive word "${candidate.word}" in slice names.`,
          location: { path: candidate.groupPath },
          ...(fixes === undefined ? {} : { fixes }),
        }
      }),
    }
  },
} satisfies Rule

export default repetitiveNaming

/**
 * Find every group of slices where one and the same word shows up in all of the slice names.
 *
 * Everything found here gets reported. Whether a report also carries fixes is decided afterwards, by
 * {@link planFixes}, which only ever narrows that set down.
 */
function detectRepetitiveWords(root: Folder): Array<RepetitiveWordCandidate> {
  const candidates: Array<RepetitiveWordCandidate> = []

  for (const layer of Object.values(getLayers(root))) {
    if (!isSliced(layer)) {
      continue
    }

    const sliceGroups = groupSlices(Object.keys(getSlices(layer)))

    for (const [group, sliceNames] of Object.entries(sliceGroups)) {
      const wordsInSliceNames = sliceNames.map(wordsIn)
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
          candidates.push({ groupPath: join(layer.path, group), word, sliceNames })
        }
      }
    }
  }

  return candidates
}

/**
 * Turn the reports that can be acted on safely into fixes.
 *
 * A report only gets fixes when the whole chain works out: the word is a suffix of every slice name,
 * the resulting names collide with nothing, the group has no second repetitive word to confuse things,
 * and every reference to the renamed slices can be rewritten.
 */
async function planFixes(
  root: Folder,
  candidates: Array<RepetitiveWordCandidate>,
): Promise<Map<RepetitiveWordCandidate, Array<Fix>>> {
  const fixesByCandidate = new Map<RepetitiveWordCandidate, Array<Fix>>()

  const plans: Array<{ candidate: RepetitiveWordCandidate; renames: Array<SliceRename> }> = []
  for (const candidate of candidates) {
    const renames = planRenames(candidate, root)
    if (renames !== null) {
      plans.push({ candidate, renames })
    }
  }

  const unambiguousPlans = discardAmbiguousPlans(plans, candidates)
  if (unambiguousPlans.length === 0) {
    return fixesByCandidate
  }

  const parseResult = await parseNearestTsConfig(root.children[0]?.path ?? root.path)
  const tsConfigs = collectRelatedTsConfigs(parseResult)

  for (const { candidate, renames } of unambiguousPlans) {
    const referenceEdits = await planReferenceEdits(root, renames, tsConfigs)

    if (referenceEdits === null) {
      continue
    }

    fixesByCandidate.set(candidate, [
      ...Object.entries(referenceEdits).map(([path, edits]): Fix => ({ type: 'edit-file', path, edits })),
      ...renames.map((rename): Fix => ({ type: 'rename', path: rename.path, newName: rename.newName })),
    ])
  }

  return fixesByCandidate
}
