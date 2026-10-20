import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.ts', 'src/app.ts'],
  format: ['esm'],
  outExtension: () => ({ js: '.mjs' }),
  dts: {
    entry: 'src/app.ts',
    resolve: true,
  },
  treeshake: true,
  clean: true,
  external: [
    '@clack/prompts',
    '@feature-sliced/steiger-plugin',
    'chokidar',
    'cosmiconfig',
    'effector',
    'empathic',
    'fastest-levenshtein',
    'globby',
    'immer',
    'micromatch',
    'patronum',
    'picocolors',
    'prexit',
    'yargs',
    'zod',
    'zod-validation-error',
  ],
  esbuildOptions(options) {
    options.define = { 'import.meta.vitest': 'undefined' }
  },
})
