# @steiger/toolkit

## 0.2.2

### Patch Changes

- c99ae46: Add repository field to package.json files for better npm metadata

  Added repository field to all public packages pointing to the GitHub repository with appropriate directory paths. This helps users find the source code repository and specific package directories within the monorepo.

- 0a95a0d: Add homepage link in package.json

## 0.2.1

### Patch Changes

- 4e331fb: Add `enableSpecificRules` function for backward compatibility and selective rule adoption

## 0.2.0

### Minor Changes

- df5870b: Separate Vitest-dependent utilities into a different entrypoint to make Vitest a truly optional peer dependency
