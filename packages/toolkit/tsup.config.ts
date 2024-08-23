import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: {
    entry: 'src/index.ts',
    resolve: true,
  },
  treeshake: true,
  clean: true,
  esbuildOptions(options) {
    options.define = { 'import.meta.vitest': 'undefined' }
  },
})
