import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.ts', 'src/app.ts'],
  format: ['esm'],
  dts: {
    entry: 'src/app.ts',
  },
  treeshake: true,
  clean: true,
  esbuildOptions(options) {
    options.define = { 'import.meta.vitest': 'undefined' }
  },
})
