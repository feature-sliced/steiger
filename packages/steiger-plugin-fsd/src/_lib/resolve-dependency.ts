import { existsSync } from 'node:fs'
import { createFSCache } from './fs-cache.js'
import { resolveImport } from '@feature-sliced/filesystem'
import { TSConfckParseResult } from 'tsconfck'
import { join } from 'node:path'

const resolutionCache = createFSCache<string | null>()

/**
 * Given a file name, an imported path, and a TSConfigs list, produce a path to the imported file, relative to TypeScript's `baseUrl`.
 *
 * The resulting path uses OS-appropriate path separators.
 *
 * See {@link resolveImport} for more details.
 */
export function resolveDependency(
  importedPath: string,
  importerPath: string,
  tsConfigs: Array<TSConfckParseResult['tsconfig']>,
  fileExists: (path: string) => boolean = existsSync,
  directoryExists: (path: string) => boolean = existsSync,
): string | null {
  const useCache = fileExists === existsSync

  if (useCache) {
    const cached = resolutionCache.get(`${importerPath}\0${importedPath}`, importerPath)
    if (cached !== undefined) return cached
  }

  let resolvedDependency = null

  for (const config of tsConfigs) {
    resolvedDependency = resolveImport(
      importedPath,
      importerPath,
      config?.compilerOptions ?? {},
      fileExists,
      directoryExists,
    )
    if (resolvedDependency !== null) {
      break
    }
  }

  if (useCache) {
    resolutionCache.set(`${importerPath}\0${importedPath}`, resolvedDependency, importerPath)
  }

  return resolvedDependency
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest

  test('resolves import with multiple tsconfigs', () => {
    const tsConfigs = [
      { extends: '@node/tsconfig.json', compilerOptions: { moduleResolution: 'Bundler' as const } },
      { compilerOptions: { moduleResolution: 'Bundler' as const, baseUrl: '.', paths: { '~/*': ['./src/*'] } } },
    ]

    const expectedFile = 'src/shared/ui/index.ts'
    const fileExists = (path: string) => path === expectedFile
    const directoryExists = (path: string) => path !== expectedFile && expectedFile.startsWith(path)

    expect(
      resolveDependency('~/shared/ui', 'src/pages/home/ui/HomePage.tsx', tsConfigs, fileExists, directoryExists),
    ).toBe(join('src', 'shared', 'ui', 'index.ts'))
  })
}
