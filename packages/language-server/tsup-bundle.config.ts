import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { server: 'src/bundle.ts' },
  banner: { js: '#!/usr/bin/env node' },
  outDir: 'dist-bundle',
  clean: true,
  format: ['cjs'],
  noExternal: [/.*/],
})
