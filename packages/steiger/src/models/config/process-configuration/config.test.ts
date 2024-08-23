import { buildValidationScheme } from './index'
import { describe, expect, it } from 'vitest'
import { Config } from '@steiger/types'

const dummyRules = [
  {
    name: 'rule1',
    check: () => ({ diagnostics: [] }),
  },
  {
    name: 'rule2',
    check: () => ({ diagnostics: [] }),
  },
]

describe('buildValidationScheme', () => {
  it('should successfully validate config with plain severities', () => {
    const scheme = buildValidationScheme(dummyRules)

    const config = [
      {
        rules: {
          rule1: 'off',
          rule2: 'warn',
        },
      },
    ]

    expect(scheme.parse(config)).toEqual(config)
  })

  it('should successfully validate config with a tuple of severity and rule options', () => {
    const scheme = buildValidationScheme(dummyRules)

    const config = [
      {
        rules: {
          rule1: ['warn', {}],
          rule2: ['error', {}],
        },
      },
    ]

    expect(scheme.parse(config)).toEqual(config)
  })

  it('should successfully validate a config with several objects', () => {
    const scheme = buildValidationScheme(dummyRules)

    const config = [
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
    ]

    expect(scheme.parse(config)).toEqual(config)
  })

  it('should successfully validate a config with ignores', () => {
    const scheme = buildValidationScheme(dummyRules)

    const config = [
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
    ]

    expect(scheme.parse(config)).toEqual(config)
  })

  it('should successfully validate a config with files', () => {
    const scheme = buildValidationScheme(dummyRules)

    const config = [
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
    ]

    expect(scheme.parse(config)).toEqual(config)
  })

  it('should successfully validate a config with files and ignores', () => {
    const scheme = buildValidationScheme(dummyRules)

    const config = [
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
    ]

    expect(scheme.parse(config)).toEqual(config)
  })

  it('should throw an error if no rules are provided', () => {
    expect(() => buildValidationScheme([])).toThrow('At least one rule must be provided by plugins!')
  })

  it('should throw an error if no config objects are provided', () => {
    const scheme = buildValidationScheme(dummyRules)

    const config = [] as Config

    expect(() => scheme.parse(config)).toThrow('At least one config object must be provided!')
  })

  it('should throw an error if a config object without rules is provided', () => {
    const scheme = buildValidationScheme(dummyRules)

    const config = [{}] as Config
    const config1 = [{ files: ['/shared'] }] as Config
    const config2 = [{ ignores: ['**/*.test.ts'] }] as Config

    expect(() => scheme.parse(config)).toThrow()
    expect(() => scheme.parse(config1)).toThrow()
    expect(() => scheme.parse(config2)).toThrow()
  })

  it('should throw an error if a non-existent rule is provided', () => {
    const scheme = buildValidationScheme(dummyRules)

    const config = [
      {
        rules: {
          rule1: 'off',
          rule3: 'warn',
        },
      },
    ]

    expect(() => scheme.parse(config)).toThrow()
  })
})
