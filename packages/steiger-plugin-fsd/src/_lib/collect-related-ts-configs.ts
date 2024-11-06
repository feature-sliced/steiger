import { TSConfckParseResult } from 'tsconfck'
import { dirname, posix } from 'node:path'
import path from 'node:path'

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
// (If some extended config is nested in a folder e.g. ./nuxt/tsconfig.json,
// it applies path aliases like '@/': ['../*'] to the project root)
function resolveRelativePathsInMergedConfig(configParseResult: CollectRelatedTsConfigsPayload) {
  const { tsconfig: mergedConfig, extended } = configParseResult

  if (
    // if there's no config it needs to be handled somewhere else
    !mergedConfig ||
    // if the merged config does not have "extends" there are no paths to resolve
    !mergedConfig.extends ||
    // if the merged config does not have compilerOptions, there is nothing to resolve
    !mergedConfig.compilerOptions ||
    // if the merged config does not have paths in compilerOptions there's nothing to resolve
    !mergedConfig.compilerOptions.paths
  ) {
    return mergedConfig
  }

  // Find the first config with paths in the "extends" chain as it overrides the others
  const firstConfigWithPaths = findFirstConfigWithPaths(configParseResult, extended || [])
  const absolutePaths = makeRelativePathAliasesAbsolute(configParseResult, firstConfigWithPaths!)

  return {
    ...mergedConfig,
    compilerOptions: {
      ...mergedConfig.compilerOptions,
      paths: absolutePaths,
    },
  }
}

function findFirstConfigWithPaths(
  parseResult: CollectRelatedTsConfigsPayload,
  extended: TSConfckParseResult[],
): CollectRelatedTsConfigsPayload | null {
  if (parseResult.tsconfig.compilerOptions?.paths || !parseResult.tsconfigFile) {
    return parseResult
  }

  // As we work with some king of globs, we need to use posix path separators
  const extendAbsolutePath = posix.join(dirname(parseResult.tsconfigFile), parseResult.tsconfig.extends)
  const extendedConfig = extended.find(({ tsconfigFile }) => tsconfigFile === extendAbsolutePath)

  return findFirstConfigWithPaths(extendedConfig!, extended)
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
      path.resolve(path.dirname(firstConfigWithPaths.tsconfigFile!), relativePath),
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
          tsconfigFile: '/.nuxt/tsconfig.json',
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
      tsconfigFile: '/tsconfig.json',
      tsconfig: {
        extends: './nuxt/tsconfig.json',
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
        extends: './nuxt/tsconfig.json',
        compilerOptions: {
          paths: {
            '~': ['/'],
            '~/*': ['/*'],
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
