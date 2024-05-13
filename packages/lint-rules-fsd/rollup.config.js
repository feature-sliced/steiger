import Module from 'node:module'

import { defineConfig } from 'rollup'
import typescriptPlugin from '@rollup/plugin-typescript'
import { readPackageUpSync } from 'read-pkg-up'
import typescriptDtsPlugin from 'rollup-plugin-dts'

const packageJson = readPackageUpSync({ normalize: true }).packageJson

export default defineConfig([
  {
    input: 'src/index.ts',
    plugins: [typescriptPlugin()],
    output: [
      {
        file: packageJson.module,
        format: 'es',
      },
    ],
    external: [
      ...Object.keys(packageJson.devDependencies ?? {}),
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.peerDependencies ?? {}),
      ...Module.builtinModules.map((m) => `node:${m}`),
      ...Module.builtinModules,
    ],
  },
  {
    input: 'src/index.ts',
    plugins: [typescriptPlugin(), typescriptDtsPlugin()],
    output: {
      file: packageJson.types,
      format: 'es',
    },
    external: [
      ...Object.keys(packageJson.devDependencies ?? {}),
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.peerDependencies ?? {}),
      ...Module.builtinModules.map((m) => `node:${m}`),
      ...Module.builtinModules,
    ],
  },
])
