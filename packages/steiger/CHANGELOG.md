# steiger

## 0.8.1

### Patch Changes

- [#286](https://github.com/feature-sliced/steiger/pull/286) [`63501ae`](https://github.com/feature-sliced/steiger/commit/63501ae71dac69d31fb7ab3dda2ae55c12824a1e) Thanks [@shubhambaghel34](https://github.com/shubhambaghel34)! - Replace legacy `__dirname` usage with `import.meta.dirname` and remove the obsolete CommonJS shim injection so the packages work cleanly in modern ESM runtimes.

- [#290](https://github.com/feature-sliced/steiger/pull/290) [`7d67ae6`](https://github.com/feature-sliced/steiger/commit/7d67ae62f03883680a154eb05b3d775aa8073ce5) Thanks [@paoValle](https://github.com/paoValle)! - Upgrade `zod` from 3 to 4, which fixes [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) (high severity) in zod 3, and `zod-validation-error` from 3 to 5 to match. Configuration validation accepts the same configs as before; the messages printed for an invalid configuration are now formatted from zod 4 issues.

- Updated dependencies [[`63501ae`](https://github.com/feature-sliced/steiger/commit/63501ae71dac69d31fb7ab3dda2ae55c12824a1e)]:
  - @feature-sliced/steiger-plugin@0.8.1

## 0.8.0

### Minor Changes

- 98751d8: move the language server implementation into a separate package, `@feature-sliced/language-server`

### Patch Changes

- a483f5a: fix severity of diagnostics in case of multiple issues per file
  - @feature-sliced/steiger-plugin@0.8.0

## 0.7.0

### Minor Changes

- 5d698c3: watch file changes in watch mode
- 2d8411e: expose file system watcher options (`stabilityThreshold`, `pollInterval`, `debounceInterval`) for `linter.watch`
- 2d8411e: add language server implementation, exposed via the `steiger-language-server` binary
- 2941d88: update minimal nodejs version, fix typescript 7 support
- 16cba3a: Add a --ignore-warnings CLI option to report errors only.

### Patch Changes

- 2bb9afe: Fix stale package versions in the --version output.
- 0ed7ae1: prevent EACCES errors for ignored files
- Updated dependencies [2d8411e]
- Updated dependencies [2bb9afe]
- Updated dependencies [2d8411e]
- Updated dependencies [2d8411e]
- Updated dependencies [04e0ae2]
- Updated dependencies [4fbedf6]
  - @feature-sliced/steiger-plugin@0.8.0

## 0.6.0

### Minor Changes

- acc97d0: Add performance profiling
- 5d698c3: watch file changes in watch mode

### Patch Changes

- Updated dependencies [fe45525]
- Updated dependencies [3bdcb95]
- Updated dependencies [4fbedf6]
  - @feature-sliced/steiger-plugin@0.7.0

## 0.5.13

### Patch Changes

- ac8320b: Cleanup package.json
- Updated dependencies [ac8320b]
- Updated dependencies [12bb1a2]
  - @feature-sliced/steiger-plugin@0.6.0

## 0.5.12

### Patch Changes

- Updated dependencies

## 0.5.11

### Patch Changes

- Fix the build files

## 0.5.10

### Patch Changes

- 8a7f6b3: Revert the switch from cosmiconfig to lilconfig due to missing support for TS files

## 0.5.9

### Patch Changes

- c99ae46: Add repository field to package.json files for better npm metadata

  Added repository field to all public packages pointing to the GitHub repository with appropriate directory paths. This helps users find the source code repository and specific package directories within the monorepo.

- 0a95a0d: Add homepage link in package.json
- 0374d15: Replaced cosmiconfig with lilconfig to reduce the number of dependencies.

## 0.5.8

### Patch Changes

- 3947639: Added processConfiguration to exports

## 0.5.7

### Patch Changes

- Updated dependencies
  - @feature-sliced/steiger-plugin@0.5.6

## 0.5.6

### Patch Changes

- 72f1981: The diagnostics from a single rule are now sorted by path in alphabetical order

## 0.5.5

### Patch Changes

- 065ea85: Switch from `minimatch` to `micromatch` to restore support for Node 18

## 0.5.4

### Patch Changes

- 5aaf1a3: Prevent hidden files like .DS_Store from breaking glob exclusions
- 80d9f46: Interactively suggest folders when a missing folder was specified in the command or when it wasn't specified at all
- b55545e: Fix the "--version" command outputting "unknown"

## 0.5.3

### Patch Changes

- 114d59c: Fix drive label handling in paths on Windows
- b3f7085: Fix 404s in rule description links

## 0.5.2

### Patch Changes

- Updated dependencies [9c1fec9]
  - @feature-sliced/steiger-plugin@0.5.2

## 0.5.1

### Patch Changes

- Updated dependencies [06af3dd]
  - @feature-sliced/steiger-plugin@0.5.1

## 0.5.0

This release brings a new configuration format! Now you can disable rules only in certain parts of the project, pass options to rules, and set the severity for rules. Also this configuration format allows you to pass third-party plugins and even write your own rules.

Example:

```javascript
// ./steiger.config.js
import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin' // you need to install separately this now

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // disable the `public-api` rule for files in the Shared layer
    files: ['./src/shared/**'],
    rules: {
      'fsd/public-api': 'off', // can also be 'warn'
    },
  },
])
```

Migrating from the old config is easy, refer to the short [migration guide](../../MIGRATION_GUIDE.md) that we created. It even has an automatic codemod :)

---

This release includes plugin support, and here's how you can write your own! For more inspiration, check out the FSD plugin (`./packages/steiger-plugin-fsd` in this repo).

```ts
import { enableAllRules, createPlugin, createConfigs } from '@steiger/toolkit'

const plugin = createPlugin({
  meta: {
    name: 'my-awesome-plugin',
    version: '1.0.0',
  },
  ruleDefinitions: [
    {
      name: 'my/rule-1',
      check(root) {
        /* … */
      },
    },
  ],
})

const configs = createConfigs({
  recommended: enableAllRules(plugin),
})

export default {
  plugin,
  configs,
}
```

### Minor Changes

- Support the new configuration format
- Add a JSON reporter (use `--reporter json`)
- 281aaca: Add error messages for old and invalid config shapes
- b184bb7: Support warning severity for diagnostics

### Patch Changes

- c6db720: Fix Steiger linting non-existent paths successfully

## 0.4.0

### Minor Changes

- 5e7fa93: Add no-segments-on-sliced-layers rule

### Patch Changes

- 79f3552: Make Steiger exit with 1 if errors are reported

## 0.3.0

### Minor Changes

- fe1973e: Redesign the diagnostic reporter to include links to rules, locations, and auto-fix information

## 0.2.0

### Minor Changes

- Implement a rudimentary auto-fix engine

## 0.1.2

### Patch Changes

- 5b7cba4: Fixed the crash in watch mode
- a4427c6: Fixed the file watcher crashing due to symlinks in node_modules

## 0.1.1

### Patch Changes

- ed35d74: Fixed the binary extension to be treated as an ES module
- ee1c457: Added a hashbang to prevent execution with Bash
