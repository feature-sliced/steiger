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
})
