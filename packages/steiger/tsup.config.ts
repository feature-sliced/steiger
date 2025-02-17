import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.ts', 'src/app.ts', 'src/app/language-server.ts'],
  format: ['esm'],
  outExtension: () => ({ js: '.mjs' }),
  dts: {
    entry: 'src/app.ts',
    resolve: true,
  },
  treeshake: true,
  clean: true,
  inject: ['./cjs-shim.ts'],
  esbuildOptions(options) {
    options.define = { 'import.meta.vitest': 'undefined' }
  },
})
