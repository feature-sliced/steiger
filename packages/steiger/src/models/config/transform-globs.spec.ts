import { describe, expect, it, vi } from 'vitest'
import { PlatformPath } from 'node:path'
import { resolve as resolveWindows } from 'node:path/win32'
import { resolve as resolveUnix } from 'node:path/posix'
import { Config, Rule } from '@steiger/types'
import { transformGlobs } from './transform-globs'

let globalPlatform = ''

vi.mock('path', async (importOriginal) => {
  const actual: PlatformPath = await importOriginal()
  return {
    ...actual,
    resolve: vi.fn((...args) => {
      return globalPlatform === 'windows' ? resolveWindows(...args) : resolveUnix(...args)
    }),
  }
})

describe('transformGlobs', () => {
  it.each([
    {
      platform: 'unix',
      configLocationPath: '/projects/dummy-project',
      expectedGlobs: [
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
      ],
    },
    {
      platform: 'windows',
      configLocationPath: 'C:/projects/dummy-project',
      expectedGlobs: [
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
      ],
    },
  ])(`should convert relative globs to absolute on $platform`, ({ platform, configLocationPath, expectedGlobs }) => {
    globalPlatform = platform
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

    expect(transformGlobs(config, configLocationPath)).toEqual(expectedGlobs)
  })

  it.each([
    {
      platform: 'unix',
      configLocationPath: '/projects/dummy-project',
      expectedGlobs: [
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
      ],
    },
    {
      platform: 'windows',
      configLocationPath: 'C:/projects/dummy-project',
      expectedGlobs: [
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
      ],
    },
  ])('should strip trailing slashes on $platform', ({ platform, configLocationPath, expectedGlobs }) => {
    globalPlatform = platform
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

    expect(transformGlobs(config, configLocationPath)).toEqual(expectedGlobs)
  })

  it.each([
    {
      platform: 'unix',
      configLocationPath: '/projects/dummy-project',
      expectedGlobs: [
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
      ],
    },
    {
      platform: 'windows',
      configLocationPath: 'C:/projects/dummy-project',
      expectedGlobs: [
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
      ],
    },
  ])(
    "should correctly transform globs that are relative but don't start with a dot on $platform",
    ({ platform, configLocationPath, expectedGlobs }) => {
      globalPlatform = platform
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

      expect(transformGlobs(config, configLocationPath)).toEqual(expectedGlobs)
    },
  )

  it.each([
    {
      platform: 'unix',
      configLocationPath: '/projects/dummy-project',
      expectedGlobs: [
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
      ],
    },
    {
      platform: 'windows',
      configLocationPath: 'C:/projects/dummy-project',
      expectedGlobs: [
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
      ],
    },
  ])('should correctly transform negated globs on $platform', ({ platform, configLocationPath, expectedGlobs }) => {
    globalPlatform = platform
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

    expect(transformGlobs(config, configLocationPath)).toEqual(expectedGlobs)
  })
})
