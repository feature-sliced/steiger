import { describe, expect, it } from 'vitest'
import { Config } from '@steiger/types'

import createRuleInstructions from './create-rule-instructions'
import { joinFromRoot } from '../../_lib/prepare-test'

describe('createRuleInstructions', () => {
  it('should create rule instructions for each rule present in the config', () => {
    const config: Config = [
      {
        rules: {
          rule1: 'warn',
          rule2: 'error',
        },
        files: ['src/shared/ui/**/*', 'src/entities/user/ui/**/*'],
        ignores: ['src/entities/user/ui/index.ts'],
      },
      {
        rules: {
          rule3: 'off',
        },
      },
    ]

    const result = createRuleInstructions(config, null)

    expect(result).toEqual({
      rule1: {
        options: null,
        globGroups: [
          {
            severity: 'warn',
            files: ['src/shared/ui/**/*', 'src/entities/user/ui/**/*'],
            ignores: ['src/entities/user/ui/index.ts'],
          },
        ],
      },
      rule2: {
        options: null,
        globGroups: [
          {
            severity: 'error',
            files: ['src/shared/ui/**/*', 'src/entities/user/ui/**/*'],
            ignores: ['src/entities/user/ui/index.ts'],
          },
        ],
      },
      rule3: {
        options: null,
        globGroups: [
          {
            severity: 'off',
            files: [],
            ignores: [],
          },
        ],
      },
    })
  })

  it('should add several glob groups for a rule if they are provided in the config', () => {
    const config: Config = [
      {
        rules: {
          rule1: 'warn',
        },
        files: ['src/shared/ui/**/*'],
        ignores: ['src/shared/ui/index.ts'],
      },
      {
        files: ['src/entities/user/ui/**/*'],
        rules: {
          rule1: 'error',
        },
      },
    ]

    expect(createRuleInstructions(config, null)).toEqual({
      rule1: {
        options: null,
        globGroups: [
          {
            severity: 'warn',
            files: ['src/shared/ui/**/*'],
            ignores: ['src/shared/ui/index.ts'],
          },
          {
            severity: 'error',
            files: ['src/entities/user/ui/**/*'],
            ignores: [],
          },
        ],
      },
    })
  })

  it('should convert relative globs to absolute', () => {
    const config: Config = [
      {
        rules: {
          rule1: 'warn',
        },
        files: ['./src/shared/ui/**/*'],
        ignores: ['./src/shared/ui/index.ts'],
      },
    ]

    expect(createRuleInstructions(config, joinFromRoot('projects', 'dummy-project'))).toEqual({
      rule1: {
        options: null,
        globGroups: [
          {
            severity: 'warn',
            files: ['/projects/dummy-project/src/shared/ui/**/*'],
            ignores: ['/projects/dummy-project/src/shared/ui/index.ts'],
          },
        ],
      },
    })
  })
})
