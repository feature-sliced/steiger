import { sep, join } from 'node:path'

/**
 * Groups slice names that share the same parent path segments.
 *
 * @example
 * groupSlices(['a/b/c', 'a/b/d', 'a/e', 'f', 'g'])
 * // => { 'a/b': ['c', 'd'], a: ['e'], '': ['f', 'g'] }
 */
export function groupSlices(sliceNames: Array<string>): Record<string, Array<string>> {
  const groups: Record<string, Array<string>> = {}

  for (const sliceName of sliceNames) {
    const segments = sliceName.split(sep)
    const name = segments.pop()
    const group = segments.join(sep)

    if (name !== undefined) {
      groups[group] ??= []
      groups[group].push(name)
    }
  }

  return groups
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest
  test('groupSlices', () => {
    expect(groupSlices([join('a', 'b', 'c'), join('a', 'b', 'd'), join('a', 'e'), 'f', 'g'])).toEqual({
      [join('a', 'b')]: ['c', 'd'],
      a: ['e'],
      '': ['f', 'g'],
    })
  })
}
