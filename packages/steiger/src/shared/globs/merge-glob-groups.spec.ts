import { describe, expect, it } from 'vitest'

import { mergeGlobGroups } from './merge-glob-groups'

describe('mergeGlobGroups', () => {
  it('should merge glob groups into one', () => {
    const merged = mergeGlobGroups([
      { files: ['/src/shared/**'], ignores: ['**/*.spec.ts'] },
      { files: ['/src/entities/**'], ignores: ['**/__mocks__/**'] },
    ])

    expect(merged).toEqual({
      files: ['/src/shared/**', '/src/entities/**'],
      ignores: ['**/*.spec.ts', '**/__mocks__/**'],
    })
  })

  it('should correctly merge glob groups when the last one is empty', () => {
    const merged = mergeGlobGroups([{ files: ['/src/shared/**'], ignores: ['**/*.spec.ts'] }, {}])

    expect(merged).toEqual({
      files: ['/src/shared/**'],
      ignores: ['**/*.spec.ts'],
    })
  })

  it('should correctly merge glob groups that miss files and ignores', () => {
    const merged = mergeGlobGroups([{ files: ['/src/shared/**'] }, { ignores: ['**/*.spec.ts'] }])

    expect(merged).toEqual({
      files: ['/src/shared/**'],
      ignores: ['**/*.spec.ts'],
    })
  })
})
