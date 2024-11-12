import { TSConfckParseResult } from 'tsconfck'
import { dirname, resolve } from 'node:path'
import { joinFromRoot } from '@steiger/toolkit'

export type CollectRelatedTsConfigsPayload = {
  tsconfig: TSConfckParseResult['tsconfig']
  tsconfigFile?: TSConfckParseResult['tsconfigFile']
  referenced?: CollectRelatedTsConfigsPayload[]
  extended?: TSConfckParseResult[]
}

/**
 * Collects main and referenced tsconfigs into a flat structure
 *
 * @example
 * ```json
 * // ./tsconfig.json
 * {
 *   "files": [],
 *   "references": [{ "path": "./tsconfig.node.json" }, { "path": "./tsconfig.app.json" }]
 * }
 *
 * // ./tsconfig.node.json
 * {
 *   "extends": "@node/tsconfig.json",
 *   //...
 * }
 *
 * // ./tsconfig.app.json
 * {
 *   "extends": "@app/tsconfig.json",
 *   //...
 * }
 *
 * // Expected output
 * [{
 *   "files": [],
 *   "references": [{ "path": "./tsconfig.node.json" }, { "path": "./tsconfig.app.json" }]
 * },
 * {
 *   "extends": "@node/tsconfig.json",
 *   //...
 * },
 * {
 *   "extends": "@app/tsconfig.json",
 *   //...
 * }]
 * ```
 */
export function collectRelatedTsConfigs(payload: CollectRelatedTsConfigsPayload) {
  const configs: Array<CollectRelatedTsConfigsPayload['tsconfig']> = []

  const setTsConfigs = ({ tsconfig, tsconfigFile, referenced, extended }: CollectRelatedTsConfigsPayload) => {
    configs.push(resolveRelativePathsInMergedConfig({ tsconfig, tsconfigFile, extended }))
    referenced?.forEach(setTsConfigs)
  }
  setTsConfigs(payload)

  return configs
}

// As tsconfck does not resolve paths in merged configs,
// namely it just takes paths from extended configs and puts them to the final merged config, we need to do it manually.
// Another reason to transform paths is that otherwise they are resolved relative
// to the folder where Steiger is launched (__dirname), so we need to make them absolute.
// (If some extended config is nested in a folder e.g. ./nuxt/tsconfig.json,
// it applies path aliases like '@/': ['../*'] to the project root)
function resolveRelativePathsInMergedConfig(configParseResult: CollectRelatedTsConfigsPayload) {
  const { tsconfig: mergedConfig, extended } = configParseResult

  if (
    // if there's no config it needs to be handled somewhere else
    !mergedConfig ||
    // if the merged config does not have compilerOptions, there is nothing to resolve
    !mergedConfig.compilerOptions ||
    // if the merged config does not have paths in compilerOptions there's nothing to resolve
    !mergedConfig.compilerOptions.paths
  ) {
    return mergedConfig
  }

  // Find the first config with paths in the "extends" chain as it overrides the others
  const firstConfigWithPaths = findFirstConfigWithPaths(extended || []) || configParseResult
  const absolutePaths = makeRelativePathAliasesAbsolute(configParseResult, firstConfigWithPaths!)

  return {
    ...mergedConfig,
    compilerOptions: {
      ...mergedConfig.compilerOptions,
      paths: absolutePaths,
    },
  }
}

function findFirstConfigWithPaths(extended: TSConfckParseResult[]): TSConfckParseResult | undefined {
  for (const parseResult of extended) {
    const { tsconfig } = parseResult

    if (tsconfig.compilerOptions?.paths) {
      return parseResult
    }
  }
}

function makeRelativePathAliasesAbsolute(
  finalConfig: CollectRelatedTsConfigsPayload,
  firstConfigWithPaths: CollectRelatedTsConfigsPayload,
) {
  const { tsconfig: mergedConfig } = finalConfig
  const absolutePaths: Record<string, Array<string>> = {}

  if (!firstConfigWithPaths.tsconfigFile) {
    return mergedConfig.compilerOptions.paths
  }

  for (const entries of Object.entries(mergedConfig.compilerOptions.paths)) {
    const [key, paths] = entries as [key: string, paths: Array<string>]
    absolutePaths[key] = paths.map((relativePath: string) =>
      resolve(dirname(firstConfigWithPaths.tsconfigFile!), relativePath),
    )
  }

  return absolutePaths
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest

  test('collects main and referenced tsconfigs into a flat structure', () => {
    const payload: CollectRelatedTsConfigsPayload = {
      tsconfig: { files: [], references: [{ path: './tsconfig.node.json' }, { path: './tsconfig.app.json' }] },
      referenced: [{ tsconfig: { extends: '@node/tsconfig.json' } }, { tsconfig: { extends: '@app/tsconfig.json' } }],
    }

    const expectedResult = [
      { files: [], references: [{ path: './tsconfig.node.json' }, { path: './tsconfig.app.json' }] },
      { extends: '@node/tsconfig.json' },
      { extends: '@app/tsconfig.json' },
    ]

    expect(collectRelatedTsConfigs(payload)).toEqual(expectedResult)
  })

  test('resolves paths in merged config if the initial config extends some other config', () => {
    const payload: CollectRelatedTsConfigsPayload = {
      extended: [
        {
          tsconfigFile: joinFromRoot('tsconfig.json'),
          tsconfig: {
            extends: './.nuxt/tsconfig.json',
          },
        },
        {
          tsconfigFile: joinFromRoot('.nuxt', 'tsconfig.json'),
          tsconfig: {
            compilerOptions: {
              paths: {
                '~': ['..'],
                '~/*': ['../*'],
              },
              strict: true,
              noUncheckedIndexedAccess: false,
              forceConsistentCasingInFileNames: true,
              noImplicitOverride: true,
              module: 'ESNext',
              noEmit: true,
            },
          },
        },
      ],
      tsconfigFile: joinFromRoot('tsconfig.json'),
      tsconfig: {
        extends: './.nuxt/tsconfig.json',
        compilerOptions: {
          paths: {
            '~': ['..'],
            '~/*': ['../*'],
          },
          strict: true,
          noUncheckedIndexedAccess: false,
          forceConsistentCasingInFileNames: true,
          noImplicitOverride: true,
          module: 'ESNext',
          noEmit: true,
        },
      },
    }

    const expectedResult = [
      {
        extends: './.nuxt/tsconfig.json',
        compilerOptions: {
          paths: {
            '~': [joinFromRoot()],
            '~/*': [joinFromRoot('*')],
          },
          strict: true,
          noUncheckedIndexedAccess: false,
          forceConsistentCasingInFileNames: true,
          noImplicitOverride: true,
          module: 'ESNext',
          noEmit: true,
        },
      },
    ]

    expect(collectRelatedTsConfigs(payload)).toEqual(expectedResult)
  })

  test('resolves paths independently from the current directory', () => {
    const payload: CollectRelatedTsConfigsPayload = {
      tsconfigFile: joinFromRoot('user', 'projects', 'project-0', 'tsconfig.json'),
      tsconfig: {
        compilerOptions: {
          paths: {
            '~': ['./src'],
            '~/*': ['./src/*'],
          },
          strict: true,
          noUncheckedIndexedAccess: false,
          forceConsistentCasingInFileNames: true,
          noImplicitOverride: true,
          module: 'ESNext',
          noEmit: true,
        },
      },
    }

    const expectedResult = [
      {
        compilerOptions: {
          paths: {
            '~': [joinFromRoot('user', 'projects', 'project-0', 'src')],
            '~/*': [joinFromRoot('user', 'projects', 'project-0', 'src', '*')],
          },
          strict: true,
          noUncheckedIndexedAccess: false,
          forceConsistentCasingInFileNames: true,
          noImplicitOverride: true,
          module: 'ESNext',
          noEmit: true,
        },
      },
    ]

    expect(collectRelatedTsConfigs(payload)).toEqual(expectedResult)
  })
}
