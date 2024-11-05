import { expect, it, vi } from 'vitest'

import { parseIntoFolder } from '@steiger/toolkit'
import insignificantSlice from './index.js'

vi.mock('tsconfck', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('tsconfck')>()),
    parse: vi.fn(() =>
      Promise.resolve({
        extended: [
          {
            tsconfigFile: '/tsconfig.json',
            tsconfig: {
              compilerOptions: {
                paths: {
                  nitropack: ['../node_modules/.pnpm/nitropack@2.9.7_magicast@0.3.5/node_modules/nitropack'],
                  defu: ['../node_modules/.pnpm/defu@6.1.4/node_modules/defu'],
                  h3: ['../node_modules/.pnpm/h3@1.13.0/node_modules/h3'],
                  consola: ['../node_modules/.pnpm/consola@3.2.3/node_modules/consola'],
                  ofetch: ['../node_modules/.pnpm/ofetch@1.4.1/node_modules/ofetch'],
                  '@unhead/vue': ['../node_modules/.pnpm/@unhead+vue@1.11.10_vue@3.5.12/node_modules/@unhead/vue'],
                  '@nuxt/devtools': [
                    '../node_modules/.pnpm/@nuxt+devtools@1.6.0_rollup@4.24.0_vite@5.4.9_@types+node@22.7.7_terser@5.36.0__vue@3.5.12/node_modules/@nuxt/devtools',
                  ],
                  '@vue/runtime-core': [
                    '../node_modules/.pnpm/@vue+runtime-core@3.5.12/node_modules/@vue/runtime-core',
                  ],
                  '@vue/compiler-sfc': [
                    '../node_modules/.pnpm/@vue+compiler-sfc@3.5.12/node_modules/@vue/compiler-sfc',
                  ],
                  'unplugin-vue-router/client': [
                    '../node_modules/.pnpm/unplugin-vue-router@0.10.8_rollup@4.24.0_vue-router@4.4.5_vue@3.5.12__vue@3.5.12/node_modules/unplugin-vue-router/client',
                  ],
                  '@nuxt/schema': ['../node_modules/.pnpm/@nuxt+schema@3.13.2_rollup@4.24.0/node_modules/@nuxt/schema'],
                  nuxt: [
                    '../node_modules/.pnpm/nuxt@3.13.2_@parcel+watcher@2.4.1_@types+node@22.7.7_ioredis@5.4.1_magicast@0.3.5_rollup@4.24_g23ghcmiilocouryy5tlrkcpeu/node_modules/nuxt',
                  ],
                  '~': ['..'],
                  '~/*': ['../*'],
                  '@': ['..'],
                  '@/*': ['../*'],
                  '~~': ['..'],
                  '~~/*': ['../*'],
                  '@@': ['..'],
                  '@@/*': ['../*'],
                  assets: ['../assets'],
                  public: ['../public'],
                  'public/*': ['../public/*'],
                  '#app': [
                    '../node_modules/.pnpm/nuxt@3.13.2_@parcel+watcher@2.4.1_@types+node@22.7.7_ioredis@5.4.1_magicast@0.3.5_rollup@4.24_g23ghcmiilocouryy5tlrkcpeu/node_modules/nuxt/dist/app',
                  ],
                  '#app/*': [
                    '../node_modules/.pnpm/nuxt@3.13.2_@parcel+watcher@2.4.1_@types+node@22.7.7_ioredis@5.4.1_magicast@0.3.5_rollup@4.24_g23ghcmiilocouryy5tlrkcpeu/node_modules/nuxt/dist/app/*',
                  ],
                  'vue-demi': [
                    '../node_modules/.pnpm/nuxt@3.13.2_@parcel+watcher@2.4.1_@types+node@22.7.7_ioredis@5.4.1_magicast@0.3.5_rollup@4.24_g23ghcmiilocouryy5tlrkcpeu/node_modules/nuxt/dist/app/compat/vue-demi',
                  ],
                  '#vue-router': ['../node_modules/.pnpm/vue-router@4.4.5_vue@3.5.12/node_modules/vue-router'],
                  '#imports': ['./imports'],
                  '#app-manifest': ['./manifest/meta/dev'],
                  '#build': ['.'],
                  '#build/*': ['./*'],
                  '#components': ['./components'],
                },
                esModuleInterop: true,
                skipLibCheck: true,
                target: 'ESNext',
                allowJs: true,
                resolveJsonModule: true,
                moduleDetection: 'force',
                isolatedModules: true,
                verbatimModuleSyntax: true,
                strict: true,
                noUncheckedIndexedAccess: false,
                forceConsistentCasingInFileNames: true,
                noImplicitOverride: true,
                module: 'ESNext',
                noEmit: true,
                lib: ['ESNext', 'dom', 'dom.iterable', 'webworker'],
                jsx: 'preserve',
                jsxImportSource: 'vue',
                types: [],
                moduleResolution: 'Bundler',
                useDefineForClassFields: true,
                noImplicitThis: true,
                allowSyntheticDefaultImports: true,
              },
            },
          },
        ],
        tsconfigFile: '/tsconfig.json',
        tsconfig: {
          extends: './nuxt/tsconfig.json',
          compilerOptions: {
            paths: {
              nitropack: ['../node_modules/.pnpm/nitropack@2.9.7_magicast@0.3.5/node_modules/nitropack'],
              defu: ['../node_modules/.pnpm/defu@6.1.4/node_modules/defu'],
              h3: ['../node_modules/.pnpm/h3@1.13.0/node_modules/h3'],
              consola: ['../node_modules/.pnpm/consola@3.2.3/node_modules/consola'],
              ofetch: ['../node_modules/.pnpm/ofetch@1.4.1/node_modules/ofetch'],
              '@unhead/vue': ['../node_modules/.pnpm/@unhead+vue@1.11.10_vue@3.5.12/node_modules/@unhead/vue'],
              '@nuxt/devtools': [
                '../node_modules/.pnpm/@nuxt+devtools@1.6.0_rollup@4.24.0_vite@5.4.9_@types+node@22.7.7_terser@5.36.0__vue@3.5.12/node_modules/@nuxt/devtools',
              ],
              '@vue/runtime-core': ['../node_modules/.pnpm/@vue+runtime-core@3.5.12/node_modules/@vue/runtime-core'],
              '@vue/compiler-sfc': ['../node_modules/.pnpm/@vue+compiler-sfc@3.5.12/node_modules/@vue/compiler-sfc'],
              'unplugin-vue-router/client': [
                '../node_modules/.pnpm/unplugin-vue-router@0.10.8_rollup@4.24.0_vue-router@4.4.5_vue@3.5.12__vue@3.5.12/node_modules/unplugin-vue-router/client',
              ],
              '@nuxt/schema': ['../node_modules/.pnpm/@nuxt+schema@3.13.2_rollup@4.24.0/node_modules/@nuxt/schema'],
              nuxt: [
                '../node_modules/.pnpm/nuxt@3.13.2_@parcel+watcher@2.4.1_@types+node@22.7.7_ioredis@5.4.1_magicast@0.3.5_rollup@4.24_g23ghcmiilocouryy5tlrkcpeu/node_modules/nuxt',
              ],
              '~': ['..'],
              '~/*': ['../*'],
              '@': ['..'],
              '@/*': ['../*'],
              '~~': ['..'],
              '~~/*': ['../*'],
              '@@': ['..'],
              '@@/*': ['../*'],
              assets: ['../assets'],
              public: ['../public'],
              'public/*': ['../public/*'],
              '#app': [
                '../node_modules/.pnpm/nuxt@3.13.2_@parcel+watcher@2.4.1_@types+node@22.7.7_ioredis@5.4.1_magicast@0.3.5_rollup@4.24_g23ghcmiilocouryy5tlrkcpeu/node_modules/nuxt/dist/app',
              ],
              '#app/*': [
                '../node_modules/.pnpm/nuxt@3.13.2_@parcel+watcher@2.4.1_@types+node@22.7.7_ioredis@5.4.1_magicast@0.3.5_rollup@4.24_g23ghcmiilocouryy5tlrkcpeu/node_modules/nuxt/dist/app/*',
              ],
              'vue-demi': [
                '../node_modules/.pnpm/nuxt@3.13.2_@parcel+watcher@2.4.1_@types+node@22.7.7_ioredis@5.4.1_magicast@0.3.5_rollup@4.24_g23ghcmiilocouryy5tlrkcpeu/node_modules/nuxt/dist/app/compat/vue-demi',
              ],
              '#vue-router': ['../node_modules/.pnpm/vue-router@4.4.5_vue@3.5.12/node_modules/vue-router'],
              '#imports': ['./imports'],
              '#app-manifest': ['./manifest/meta/dev'],
              '#build': ['.'],
              '#build/*': ['./*'],
              '#components': ['./components'],
            },
            esModuleInterop: true,
            skipLibCheck: true,
            target: 'ESNext',
            allowJs: true,
            resolveJsonModule: true,
            moduleDetection: 'force',
            isolatedModules: true,
            verbatimModuleSyntax: true,
            strict: true,
            noUncheckedIndexedAccess: false,
            forceConsistentCasingInFileNames: true,
            noImplicitOverride: true,
            module: 'ESNext',
            noEmit: true,
            lib: ['ESNext', 'dom', 'dom.iterable', 'webworker'],
            jsx: 'preserve',
            jsxImportSource: 'vue',
            types: [],
            moduleResolution: 'Bundler',
            useDefineForClassFields: true,
            noImplicitThis: true,
            allowSyntheticDefaultImports: true,
          },
        },
      }),
    ),
  }
})

vi.mock('node:fs', async (importOriginal) => {
  const originalFs = await importOriginal<typeof import('fs')>()
  const { createFsMocks } = await import('@steiger/toolkit')

  return createFsMocks(
    {
      '/features/session/register/index.ts': 'import {RegisterForm} from "./ui/RegisterForm.vue"',
      '/features/session/register/ui/RegisterForm.vue': '',

      '/features/session/logout/index.ts': 'import {LogoutButton} from "./ui/LogoutButton.vue"',
      '/features/session/logout/ui/LogoutButton.vue': '',

      '/features/session/login/index.ts': 'import {LoginForm} from "./ui/LoginForm.vue"',
      '/features/session/login/ui/LoginForm.vue': '',

      '/pages/home/index.ts': '',
      '/pages/home/ui/home.vue':
        '<template>Home page</template> <script>import { PostCard } from "~/entities/post"; import {RegisterFrom} from "~/features/session/register"; import {LoginForm} from "~/features/session/login"; import {LogoutButton} from "~/features/session/logout"</script>',
      '/pages/category/index.ts': '',
      '/pages/category/ui/category.vue':
        '<template>Home page</template> <script>import { PostCard } from "~/entities/post"; import {RegisterFrom} from "~/features/session/register"; import {LoginForm} from "~/features/session/login"; import {LogoutButton} from "~/features/session/logout"</script>',
    },
    originalFs,
  )
})

it('should report no errors on a project with Vue Single-File Components (*.vue files)', async () => {
  const root = parseIntoFolder(`
    📂 features
      📂 session
        📂 login
          📂 ui
            LoginForm.vue
          📄 index.ts
        📂 logout
          📂 ui
            LogoutButton.vue
          📄 index.ts
        📂 register
          📂 ui
            RegisterForm.vue
          📄 index.ts
    📂 pages
      📂 home
        📂 ui
          📄 home.vue
        📄 index.ts
      📂 category
        📂 ui
          📄 category.vue
        📄 index.ts
  `)

  expect((await insignificantSlice.check(root)).diagnostics).toEqual([])
})
