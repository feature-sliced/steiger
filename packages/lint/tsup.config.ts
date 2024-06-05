import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.ts', 'src/app.ts'],
  format: ['esm'],
  dts: true,
  esbuildOptions(options) {
    options.define = { 'import.meta.vitest': 'undefined' }
  },
})
