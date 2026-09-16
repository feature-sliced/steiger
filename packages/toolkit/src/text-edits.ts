import type { TextEdit } from '@steiger/types'

/**
 * Sort text edits so that the ones later in the file come first, and check that none of them overlap.
 *
 * Applying edits back-to-front keeps the offsets of the not-yet-applied edits valid.
 *
 * @throws if two edits overlap, since the result of applying them would be ambiguous.
 */
function sortAndValidate(edits: Array<TextEdit>): Array<TextEdit> {
  const sorted = [...edits].sort((a, b) => b.start - a.start || b.end - a.end)

  for (let i = 0; i < sorted.length - 1; i++) {
    const later = sorted[i]
    const earlier = sorted[i + 1]

    if (earlier.end > later.start) {
      throw new Error(`Overlapping text edits: [${earlier.start}, ${earlier.end}) and [${later.start}, ${later.end}).`)
    }
  }

  return sorted
}

/** Check if a set of text edits can be applied together (i.e. none of them overlap). */
export function textEditsOverlap(edits: Array<TextEdit>): boolean {
  try {
    sortAndValidate(edits)
    return false
  } catch {
    return true
  }
}

/**
 * Apply a set of text edits to a string.
 *
 * The edits may come in any order, but they must not overlap.
 *
 * @throws if two edits overlap or if an edit points outside of the source.
 */
export function applyTextEdits(source: string, edits: Array<TextEdit>): string {
  let result = source

  for (const edit of sortAndValidate(edits)) {
    if (edit.start < 0 || edit.end > source.length || edit.start > edit.end) {
      throw new Error(
        `Text edit [${edit.start}, ${edit.end}) is out of bounds for a source of ${source.length} characters.`,
      )
    }

    result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end)
  }

  return result
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest

  test('applyTextEdits applies several edits regardless of their order', () => {
    const source = `import { Home } from '@/pages/homePage'\nimport { About } from '@/pages/aboutPage'\n`

    expect(
      applyTextEdits(source, [
        { start: 71, end: 80, replacement: 'about' },
        { start: 30, end: 38, replacement: 'home' },
      ]),
    ).toBe(`import { Home } from '@/pages/home'\nimport { About } from '@/pages/about'\n`)
  })

  test('applyTextEdits rejects overlapping edits', () => {
    expect(() =>
      applyTextEdits('abcdef', [
        { start: 0, end: 3, replacement: 'x' },
        { start: 2, end: 5, replacement: 'y' },
      ]),
    ).toThrow(/Overlapping text edits/)
  })

  test('applyTextEdits allows edits that touch but do not overlap', () => {
    expect(
      applyTextEdits('abcdef', [
        { start: 0, end: 3, replacement: 'X' },
        { start: 3, end: 6, replacement: 'Y' },
      ]),
    ).toBe('XY')
  })

  test('textEditsOverlap detects conflicts', () => {
    expect(textEditsOverlap([{ start: 0, end: 3, replacement: '' }])).toBe(false)
    expect(
      textEditsOverlap([
        { start: 0, end: 3, replacement: '' },
        { start: 1, end: 2, replacement: '' },
      ]),
    ).toBe(true)
  })
}
