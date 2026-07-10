import type { readFileSync, statSync } from 'node:fs'

/**
 * Creates a mocked fs module that returns the provided files.
 *
 * @param files - Map of file paths to their mocked string contents. Reads of these paths return the given content.
 * @param importOriginal - Optional vitest factory callback resolving the real `node:fs` module. When provided, reads of unmocked paths fall back to the real fs; otherwise they throw.
 * @example
 * ```ts
 * vi.mock('node:fs', () => createMockedNodeFs({ 'index.js': 'const a = 2;' }))
 *
 * // allow original fs methods for other files
 * vi.mock('node:fs', (importOriginal) => createMockedNodeFs({ 'index.js': 'const a = 2;' }, importOriginal))
 * ```
 */
export async function createMockedNodeFs(files: Record<string, string>, importOriginal?: () => Promise<unknown>) {
  const actual = (await importOriginal?.()) as
    | { readFileSync: typeof readFileSync; statSync: typeof statSync }
    | undefined

  return {
    ...actual,
    // Add other mocked fs methods here if needed
    readFileSync: ((path: string, options) => {
      if (path in files) return files[path]

      if (!actual) throw new Error(`File "${path}" is not mocked`)
      return actual.readFileSync(path, options)
    }) as typeof readFileSync,
    statSync: (path: string) => {
      if (path in files) return { mtimeMs: 0 }

      if (!actual) throw new Error(`File "${path}" is not mocked`)
      return actual.statSync(path)
    },
  }
}
