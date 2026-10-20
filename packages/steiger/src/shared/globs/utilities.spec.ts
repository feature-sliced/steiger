import { describe, expect, it } from 'vitest'

import { getGlobPath, replaceGlobPath, isNegatedGlob } from './utilities'

describe('isNegated', () => {
  it('should return true if the pattern is negated', () => {
    expect(isNegatedGlob('!src/shared/ui/**')).toBe(true)
  })

  it('should return false if the pattern is not negated', () => {
    expect(isNegatedGlob('src/shared/ui/**')).toBe(false)
  })
})

describe('getGlobPath', () => {
  it('should return the path without the negation', () => {
    expect(getGlobPath('!src/shared/ui/**')).toBe('src/shared/ui/**')
  })

  it('should return the path as is if it is not negated', () => {
    expect(getGlobPath('src/shared/ui/**')).toBe('src/shared/ui/**')
  })
})

describe('replaceGlobPath', () => {
  it('should preserve the negation when replacing the path', () => {
    expect(replaceGlobPath('!src/shared/ui/**', '/projects/project-1/src/shared/ui/**')).toBe(
      '!/projects/project-1/src/shared/ui/**',
    )
  })

  it('should replace the path without changing an unnegated glob', () => {
    expect(replaceGlobPath('src/shared/ui/**', '/projects/project-1/src/shared/ui/**')).toBe(
      '/projects/project-1/src/shared/ui/**',
    )
  })
})
