import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/test.ts'],
  format: ['esm'],
  dts: {
    entry: ['src/index.ts', 'src/test.ts'],
    resolve: true,
  },
  treeshake: true,
  clean: true,
})
