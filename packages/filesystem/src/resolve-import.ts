import { resolveModuleName, sys, type CompilerOptions } from "typescript";

/**
 * Given a file name, an imported path, and a TSConfig object, produce a path to the imported file, relative to TypeScript's `baseUrl`.
 *
 * @example
 * ```tsx
 * // ./src/pages/home/ui/HomePage.tsx
 * import { Button } from "~/shared/ui";
 * ```
 *
 * ```json
 * // ./tsconfig.json
 * {
 *   "compilerOptions": {
 *     "moduleResolution": "Bundler",
 *     "baseUrl": ".",
 *     "paths": {
 *       "~/*": ["./src/*"],
 *     },
 *   },
 * }
 * ```
 *
 * ```tsx
 * resolveImport(
 *   "~/shared/ui",
 *   "./src/pages/home/ui/HomePage.tsx",
 *   { moduleResolution: "Bundler", baseUrl: ".", paths: { "~/*": ["./src/*"] } },
 *   fs.existsSync
 * );
 * ```
 * Expected output: `src/shared/ui/index.ts`
 */
export function resolveImport(
  importedPath: string,
  importerPath: string,
  tsCompilerOptions: CompilerOptions,
  fileExists: (path: string) => boolean,
  directoryExists?: (path: string) => boolean,
): string | null {
  return (
    resolveModuleName(importedPath, importerPath, tsCompilerOptions, {
      ...sys,
      fileExists,
      directoryExists,
    }).resolvedModule?.resolvedFileName ?? null
  );
}
