# @feature-sliced/steiger-plugin

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
