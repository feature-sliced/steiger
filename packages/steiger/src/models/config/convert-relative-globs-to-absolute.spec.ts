import { describe, it, expect } from 'vitest'
import { Config } from '@steiger/types'

import { joinFromRoot } from '../../_lib/prepare-test'
import { convertRelativeGlobsToAbsolute } from './convert-relative-globs-to-absolute'

describe('convertRelativeGlobsToAbsolute', () => {
  it('should convert relative globs to absolute', () => {
    const config: Config = [
      {
        ignores: ['./src/entities/**'],
      },
      {
        rules: {
          rule1: 'warn',
        },
        files: ['./src/shared/ui/**/*'],
        ignores: ['./src/shared/ui/index.ts'],
      },
    ]

    expect(convertRelativeGlobsToAbsolute(config, joinFromRoot('projects', 'dummy-project'))).toEqual([
      {
        ignores: ['/projects/dummy-project/src/entities/**'],
      },
      {
        rules: {
          rule1: 'warn',
        },
        files: ['/projects/dummy-project/src/shared/ui/**/*'],
        ignores: ['/projects/dummy-project/src/shared/ui/index.ts'],
      },
    ])
  })
})
