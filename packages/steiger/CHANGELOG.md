# steiger

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
