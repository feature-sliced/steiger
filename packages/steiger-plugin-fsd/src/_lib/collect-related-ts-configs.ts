import { TSConfckParseResult } from 'tsconfck'

export type CollectRelatedTsConfigsPayload = {
  tsconfig: TSConfckParseResult['tsconfig']
  referenced?: CollectRelatedTsConfigsPayload[]
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

  const setTsConfigs = ({ tsconfig, referenced }: CollectRelatedTsConfigsPayload) => {
    configs.push(tsconfig)
    referenced?.forEach(setTsConfigs)
  }
  setTsConfigs(payload)

  return configs
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
}
