import { sep } from 'node:path'

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
    expect(groupSlices(['a/b/c', 'a/b/d', 'a/e', 'f', 'g'])).toEqual({
      'a/b': ['c', 'd'],
      'a': ['e'],
      '': ['f', 'g'],
    })
  })
}
