import { buildValidationScheme } from './config'
import { describe, expect, it } from 'vitest'

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

    const config = {
      rules: {
        rule1: 'off',
        rule2: 'warn',
      },
    }

    expect(scheme.parse(config)).toEqual(config)
  })

  it('should successfully validate config with a tuple of severity and rule options', () => {
    const scheme = buildValidationScheme(dummyRules)

    const config = {
      rules: {
        rule1: ['warn', {}],
        rule2: ['error', {}],
      },
    }

    expect(scheme.parse(config)).toEqual(config)
  })

  it('should fail to validate config with no rules enabled', () => {
    const scheme = buildValidationScheme(dummyRules)

    const config = {
      rules: {
        rule1: 'off',
        rule2: 'off',
      },
    }

    expect(() => scheme.parse(config)).toThrow('At least one rule must be enabled')
  })

  it('should fail to validate config with no rules provided', () => {
    const scheme = buildValidationScheme(dummyRules)

    const config = {
      rules: {},
    }

    expect(() => scheme.parse(config)).toThrow('At least one rule must be enabled')
  })
})
