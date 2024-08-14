import { resolveImport } from '@feature-sliced/filesystem'
import { TSConfckParseResult } from 'tsconfck'
import { join } from 'node:path'

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
  fileExists: (path: string) => boolean,
  directoryExists?: (path: string) => boolean,
): string | null {
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

  return resolvedDependency
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest

  test('resolves import with multiple tsconfigs', () => {
    const tsConfigs = [
      { extends: '@node/tsconfig.json', compilerOptions: { moduleResolution: 'Bundler' as const } },
      { compilerOptions: { moduleResolution: 'Bundler' as const, baseUrl: '.', paths: { '~/*': ['./src/*'] } } },
    ]

    const fileExists = (path: string) => {
      return path === 'src/shared/ui/index.ts'
    }

    expect(resolveDependency('~/shared/ui', 'src/pages/home/ui/HomePage.tsx', tsConfigs, fileExists)).toBe(
      join('src', 'shared', 'ui', 'index.ts'),
    )
  })
}
