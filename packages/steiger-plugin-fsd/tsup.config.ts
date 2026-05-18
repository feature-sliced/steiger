import { exec } from 'child_process'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  treeshake: true,
  clean: true,
  esbuildOptions(options) {
    options.define = { 'import.meta.vitest': 'undefined' }
  },
  onSuccess: async () => {
    exec('cp -r src/_language-tools/parsers ./dist')
    exec('tsc --emitDeclarationOnly')
  },
})
