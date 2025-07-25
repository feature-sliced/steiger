# @feature-sliced/steiger-plugin

## 0.5.7

### Patch Changes

- c99ae46: Add repository field to package.json files for better npm metadata

  Added repository field to all public packages pointing to the GitHub repository with appropriate directory paths. This helps users find the source code repository and specific package directories within the monorepo.

- 0a95a0d: Add homepage link in package.json

## 0.5.6

### Patch Changes

- 4e331fb: Split `forbidden-imports` rule into granular `no-higher-level-imports` and `no-cross-imports` rules for better flexibility
  The `forbidden-imports` rule still remains for backward compatibility. If you want to use the new rules, enable them explicitly in the config and disable the `forbidden-imports` rule.
- 1281d60: Support `sliceA/@x/sliceB/index.ts` as cross-import public APIs

## 0.5.5

### Patch Changes

- b8d083c: Add support for multiple public APIs like `index.client.js` and `index.server.js`

## 0.5.4

### Patch Changes

- b55545e: Change the plugin name string to match the npm package name
- 26130b5: Add an exception to the `insignificant-slice` rule when the only usage site is the App layer

## 0.5.3

### Patch Changes

- Republish the package to fix a publishing error

## 0.5.2

### Patch Changes

- 9c1fec9: Fix path alias resolution when `baseUrl` is present in tsconfig

## 0.5.1

### Patch Changes

- 06af3dd: Fix path resolution on Windows

## 0.5.0

### Minor Changes

- 1bb6c4b: Add new `no-ui-in-app` rule
- 7057543: Add new `typo-in-layer-name` rule

### Patch Changes

- b0dc51b: Add a Vue test case for insignificant-slice
- 8291fc7: Fix the alias resolution in referenced TS configs
- 9ce48b6: Relax the public API constraints on `shared/lib` and `shared/ui`

## 0.4.0

### Minor Changes

- 5e7fa93: Add no-segments-on-sliced-layers rule

### Patch Changes

- b1866e8: Add an exception for app layer to no-layer-public-api rule
- 4ed8d22: Make sure forbidden-imports rule checks files directly inside layers

## 0.3.0

### Minor Changes

- d6909c9: Add location information to the diagnostic and refactor the rules to supply it

## 0.2.0

### Minor Changes

- Add a new rule `import-locality`
- BREAKING: Stop exporting types from @feature-sliced/steiger-plugin, moving them to a private package @steiger/types instead. Later they will be exposed in the toolkit for building custom rules.
- Add a new rule `no-file-segments`
- Add a new rule `no-processes`

### Patch Changes

- Fix the rules not working on Windows
- Fix the `repetitive-naming` rule complaining about a single slice
- Fix the `public-api` rule demanding indexes on App
