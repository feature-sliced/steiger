import { describe, expect, it } from 'vitest'
import { Config, Rule } from '@steiger/types'
import { transformGlobs } from './transform-globs'

const platform = process.platform

describe('transformGlobs', () => {
  it.runIf(platform === 'linux')(`should convert relative globs to absolute`, () => {
    const config: Config<Array<Rule>> = [
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

    expect(transformGlobs(config, '/projects/dummy-project')).toEqual([
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

  it.runIf(platform === 'win32')(`should convert relative globs to absolute`, () => {
    const config: Config<Array<Rule>> = [
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

    expect(transformGlobs(config, 'C:/projects/dummy-project')).toEqual([
      {
        ignores: ['C:/projects/dummy-project/src/entities/**'],
      },
      {
        rules: {
          rule1: 'warn',
        },
        files: ['C:/projects/dummy-project/src/shared/ui/**/*'],
        ignores: ['C:/projects/dummy-project/src/shared/ui/index.ts'],
      },
    ])
  })

  it.runIf(platform === 'linux')('should strip trailing slashes', () => {
    const config: Config<Array<Rule>> = [
      {
        ignores: ['./src/entities/', '**/shared/'],
      },
      {
        rules: {
          rule1: 'warn',
        },
        files: ['./src/shared/ui/', '**/pages/'],
        ignores: ['./src/shared/ui/index.ts'],
      },
    ]

    expect(transformGlobs(config, '/projects/dummy-project')).toEqual([
      {
        ignores: ['/projects/dummy-project/src/entities', '/projects/dummy-project/**/shared'],
      },
      {
        rules: {
          rule1: 'warn',
        },
        files: ['/projects/dummy-project/src/shared/ui', '/projects/dummy-project/**/pages'],
        ignores: ['/projects/dummy-project/src/shared/ui/index.ts'],
      },
    ])
  })

  it.runIf(platform === 'win32')('should strip trailing slashes', () => {
    const config: Config<Array<Rule>> = [
      {
        ignores: ['./src/entities/', '**/shared/'],
      },
      {
        rules: {
          rule1: 'warn',
        },
        files: ['./src/shared/ui/', '**/pages/'],
        ignores: ['./src/shared/ui/index.ts'],
      },
    ]

    expect(transformGlobs(config, 'C:/projects/dummy-project')).toEqual([
      {
        ignores: ['C:/projects/dummy-project/src/entities', 'C:/projects/dummy-project/**/shared'],
      },
      {
        rules: {
          rule1: 'warn',
        },
        files: ['C:/projects/dummy-project/src/shared/ui', 'C:/projects/dummy-project/**/pages'],
        ignores: ['C:/projects/dummy-project/src/shared/ui/index.ts'],
      },
    ])
  })

  it.runIf(platform === 'linux')(
    "should correctly transform globs that are relative but don't start with a dot",
    () => {
      const config: Config<Array<Rule>> = [
        {
          ignores: ['src/entities/**'],
        },
        {
          rules: {
            rule1: 'warn',
          },
          files: ['src/shared/ui/**/*'],
          ignores: ['src/shared/ui/index.ts'],
        },
      ]

      expect(transformGlobs(config, '/projects/dummy-project')).toEqual([
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
    },
  )

  it.runIf(platform === 'win32')(
    "should correctly transform globs that are relative but don't start with a dot",
    () => {
      const config: Config<Array<Rule>> = [
        {
          ignores: ['src/entities/**'],
        },
        {
          rules: {
            rule1: 'warn',
          },
          files: ['src/shared/ui/**/*'],
          ignores: ['src/shared/ui/index.ts'],
        },
      ]

      expect(transformGlobs(config, 'C:/projects/dummy-project')).toEqual([
        {
          ignores: ['C:/projects/dummy-project/src/entities/**'],
        },
        {
          rules: {
            rule1: 'warn',
          },
          files: ['C:/projects/dummy-project/src/shared/ui/**/*'],
          ignores: ['C:/projects/dummy-project/src/shared/ui/index.ts'],
        },
      ])
    },
  )

  it.runIf(platform === 'linux')('should correctly transform negated globs', () => {
    const config: Config<Array<Rule>> = [
      {
        ignores: ['!src/entities/**'],
      },
      {
        rules: {
          rule1: 'warn',
        },
        files: ['!**/shared/ui/**/*'],
        ignores: ['!src/shared/ui/index.ts'],
      },
    ]

    expect(transformGlobs(config, '/projects/dummy-project')).toEqual([
      {
        ignores: ['!/projects/dummy-project/src/entities/**'],
      },
      {
        rules: {
          rule1: 'warn',
        },
        files: ['!/projects/dummy-project/**/shared/ui/**/*'],
        ignores: ['!/projects/dummy-project/src/shared/ui/index.ts'],
      },
    ])
  })

  it.runIf(platform === 'win32')('should correctly transform negated globs', () => {
    const config: Config<Array<Rule>> = [
      {
        ignores: ['!src/entities/**'],
      },
      {
        rules: {
          rule1: 'warn',
        },
        files: ['!**/shared/ui/**/*'],
        ignores: ['!src/shared/ui/index.ts'],
      },
    ]

    expect(transformGlobs(config, 'C:/projects/dummy-project')).toEqual([
      {
        ignores: ['!C:/projects/dummy-project/src/entities/**'],
      },
      {
        rules: {
          rule1: 'warn',
        },
        files: ['!C:/projects/dummy-project/**/shared/ui/**/*'],
        ignores: ['!C:/projects/dummy-project/src/shared/ui/index.ts'],
      },
    ])
  })
})
