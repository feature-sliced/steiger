import { describe, expect, it } from 'vitest'
import type { Config, Rule } from '@steiger/types'

import createRuleInstructions from './create-rule-instructions'

describe('createRuleInstructions', () => {
  it('should create rule instructions for each rule present in the config', () => {
    const config: Config<Array<Rule>> = [
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

    const result = createRuleInstructions(config)

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
          },
        ],
      },
    })
  })

  it('should add several glob groups for a rule if they are provided in the config', () => {
    const config: Config<Array<Rule>> = [
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

    expect(createRuleInstructions(config)).toEqual({
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
          },
        ],
      },
    })
  })
})
