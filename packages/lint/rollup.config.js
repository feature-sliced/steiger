import Module from 'node:module'

import { defineConfig } from 'rollup'
import replace from '@rollup/plugin-replace'
import typescriptPlugin from '@rollup/plugin-typescript'
import { readPackageUpSync } from 'read-pkg-up'
import typescriptDtsPlugin from 'rollup-plugin-dts'

const packageJson = readPackageUpSync({ normalize: true }).packageJson

export default defineConfig([
  {
    input: 'src/cli.ts',
    plugins: [
      typescriptPlugin(),
      replace({
        'import.meta.vitest': 'undefined',
      }),
    ],
    output: [
      {
        file: packageJson.bin['fsd-lint'],
        format: 'es',
        banner: '#!/usr/bin/env node\n',
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
    input: 'src/app.ts',
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
    input: 'src/app.ts',
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
