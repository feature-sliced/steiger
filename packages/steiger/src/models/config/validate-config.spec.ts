import { describe, expect, it } from 'vitest'
import { Config, Plugin, Rule } from '@steiger/types'

import { buildValidationScheme, validateConfig } from './validate-config'

const dummyPlugin: Plugin = {
  meta: {
    name: 'dummy',
    version: '1.0.0',
  },
  getRuleDescriptionUrl(ruleName: string): URL {
    return new URL(`http://example.com/${ruleName}`)
  },
  ruleDefinitions: [
    {
      name: 'rule1',
      check() {
        return { diagnostics: [] }
      },
    },
    {
      name: 'rule2',
      check() {
        return { diagnostics: [] }
      },
    },
  ],
}

describe('buildValidationScheme', () => {
  it('should successfully validate config with plain severities', () => {
    const config = [
      dummyPlugin,
      {
        rules: {
          rule1: 'off',
          rule2: 'warn',
        },
      },
    ] as Config<Array<Rule>>
    const scheme = buildValidationScheme(config)

    expect(() => scheme.parse(config)).not.toThrow()
  })

  it('should successfully validate config with a tuple of severity and rule options', () => {
    const config = [
      dummyPlugin,
      {
        rules: {
          rule1: ['warn', {}],
          rule2: ['error', {}],
        },
      },
    ] as Config<Array<Rule>>
    const scheme = buildValidationScheme(config)

    expect(() => scheme.parse(config)).not.toThrow()
  })

  it('should successfully validate a config with several objects', () => {
    const config = [
      dummyPlugin,
      {
        rules: {
          rule1: 'off',
        },
      },
      {
        rules: {
          rule2: 'warn',
        },
      },
    ] as Config<Array<Rule>>

    const scheme = buildValidationScheme(config)

    expect(() => scheme.parse(config)).not.toThrow()
  })

  it('should successfully validate a config with ignores', () => {
    const config = [
      dummyPlugin,
      {
        ignores: ['/shared'],
        rules: {
          rule1: 'off',
        },
      },
      {
        ignores: ['/shared'],
        rules: {
          rule2: 'warn',
        },
      },
    ] as Config<Array<Rule>>
    const scheme = buildValidationScheme(config)

    expect(() => scheme.parse(config)).not.toThrow()
  })

  it('should successfully validate a config with files', () => {
    const config = [
      dummyPlugin,

      {
        files: ['/shared'],
        rules: {
          rule1: 'off',
        },
      },
      {
        files: ['/shared'],
        rules: {
          rule2: 'warn',
        },
      },
    ] as Config<Array<Rule>>
    const scheme = buildValidationScheme(config)

    expect(() => scheme.parse(config)).not.toThrow()
  })

  it('should successfully validate a config with files and ignores', () => {
    const config = [
      dummyPlugin,
      {
        files: ['/shared'],
        ignores: ['**/*.test.ts'],
        rules: {
          rule1: 'off',
        },
      },
      {
        files: ['/shared'],
        ignores: ['**/*.test.ts'],
        rules: {
          rule2: 'warn',
        },
      },
    ] as Config<Array<Rule>>
    const scheme = buildValidationScheme(config)

    expect(() => scheme.parse(config)).not.toThrow()
  })

  it('should throw an error if no plugins are provided', () => {
    const config = [
      {
        rules: {
          rule1: 'off',
        },
      },
    ] as Config<Array<Rule>>
    expect(() => buildValidationScheme(config)).toThrow('At least one rule must be provided by plugins!')
  })

  it('should throw an error if no config objects are provided', () => {
    const config = [dummyPlugin] as Config<Array<Rule>>
    const scheme = buildValidationScheme(config)

    expect(() => scheme.parse(config)).toThrow('At least one config object must be provided!')
  })

  it('should throw an error if a config object without rules is provided', () => {
    const config = [dummyPlugin, {}] as Config<Array<Rule>>
    const config1 = [dummyPlugin, { files: ['/shared'] }] as Config<Array<Rule>>
    const config2 = [dummyPlugin, { ignores: ['**/*.test.ts'] }] as Config<Array<Rule>>

    const scheme = buildValidationScheme(config)
    const scheme1 = buildValidationScheme(config1)
    const scheme2 = buildValidationScheme(config2)

    expect(() => scheme.parse(config)).toThrow()
    expect(() => scheme1.parse(config1)).toThrow()
    expect(() => scheme2.parse(config2)).toThrow()
  })

  it('should throw an error if a non-existent rule is provided', () => {
    const config = [
      dummyPlugin,
      {
        rules: {
          rule1: 'off',
          rule3: 'warn',
        },
      },
    ] as Config<Array<Rule>>
    const scheme = buildValidationScheme(config)

    expect(() => scheme.parse(config)).toThrow()
  })

  it('should correctly validate a config with global ignores', () => {
    const config = [
      dummyPlugin,
      {
        ignores: ['/src/shared/**'],
      },
      {
        ignores: ['/src/entities/**'],
        rules: {
          rule2: 'warn',
        },
      },
    ]
    const scheme = buildValidationScheme(config)

    expect(() => scheme.parse(config)).not.toThrow()
  })

  it('should correctly validate a config with unique rule options', () => {
    const config = [
      dummyPlugin,
      {
        ignores: ['/src/shared/**'],
      },
      {
        ignores: ['/src/entities/**'],
        rules: {
          rule2: ['warn', { option1: 'value1' }],
        },
      },
    ]
    const scheme = buildValidationScheme(config)

    expect(() => scheme.parse(config)).not.toThrow()
  })

  it('should successfully validate when the config provides a rule with multiple but identical options', () => {
    const config: Config<Array<Rule>> = [
      dummyPlugin,
      {
        rules: {
          rule1: ['warn', { option1: 'value1' }],
          rule2: ['error', {}],
        },
      },
      {
        files: ['src/shared/ui/**/*', 'src/entities/user/ui/**/*'],
        rules: {
          rule1: ['warn', { option1: 'value1' }],
        },
      },
    ]
    const scheme = buildValidationScheme(config)

    expect(() => scheme.parse(config)).not.toThrow()
  })

  it('should throw an error when the config provides a rule with multiple but different options', () => {
    const config: Config<Array<Rule>> = [
      dummyPlugin,
      {
        rules: {
          rule1: ['warn', { option1: 'value1' }],
          rule2: ['error', {}],
        },
      },
      {
        files: ['src/shared/ui/**/*', 'src/entities/user/ui/**/*'],
        rules: {
          rule1: [
            'warn',
            {
              option1: 'value2',
            },
          ],
        },
      },
    ]
    const scheme = buildValidationScheme(config)

    expect(() => scheme.parse(config)).toThrow()
  })

  it('should throw an error when duplicate rule definition are provided', () => {
    const config: Config<Array<Rule>> = [
      dummyPlugin,
      dummyPlugin,
      {
        rules: {
          rule1: ['warn', { option1: 'value1' }],
          rule2: ['error', {}],
        },
      },
      {
        files: ['src/shared/ui/**/*', 'src/entities/user/ui/**/*'],
        rules: {
          rule1: ['warn', { option1: 'value1' }],
        },
      },
    ]
    const scheme = buildValidationScheme(config)

    expect(() => scheme.parse(config)).toThrow()
  })
})

describe('validateConfig', () => {
  it('should throw an error when an old-style config is provided', () => {
    // @ts-expect-error testing invalid input
    expect(() => validateConfig({})).toThrow()
  })

  it('should throw an error when a config of wrong shape is provided ', () => {
    // @ts-expect-error testing invalid input
    expect(() => validateConfig('')).toThrow()

    // @ts-expect-error testing invalid input
    expect(() => validateConfig(234234234)).toThrow()

    // @ts-expect-error testing invalid input
    expect(() => validateConfig(true)).toThrow()
  })
})
