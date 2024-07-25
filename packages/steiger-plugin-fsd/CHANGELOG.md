# @feature-sliced/steiger-plugin

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
