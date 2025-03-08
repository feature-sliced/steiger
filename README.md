# Steiger

[![NPM Version](https://img.shields.io/npm/v/steiger)](https://www.npmjs.com/package/steiger)

Universal file structure and project architecture linter.

> [!NOTE]
> The project is in beta and in active development. Some APIs may change.

> [!NOTE]
> Version 0.5.0 introduced a new config file format. We have a codemod to automatically update your config, see the [migration guide](./MIGRATION_GUIDE.md).

## Features

- Built-in set of rules to validate adherence to [Feature-Sliced Design](https://feature-sliced.design/)
- Watch mode
- Rule configurability

## Installation

```bash
npm i -D steiger

# If you want to check compliance to Feature-Sliced Design, also install this:
npm i -D @feature-sliced/steiger-plugin
```

## Usage

```bash
npx steiger ./src
```

To run in watch mode, add `-w`/`--watch` to the command:

```bash
npx steiger ./src --watch
```

## Configuration

Steiger is zero-config! If you don't want to disable certain rules, you can safely skip this section.

Steiger is configurable via `cosmiconfig`. That means that you can create a `steiger.config.ts` or `steiger.config.js` file in the root of your project to configure the rules. Import `{ defineConfig } from "steiger"` to get autocompletion.

The config file shape is highly inspired by ESLint's config file, so if you have configured ESLint before, you'll find it easy to configure Steiger.

### Example

```javascript
// ./steiger.config.js
import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // disable the `public-api` rule for files in the Shared layer
    files: ['./src/shared/**'],
    rules: {
      'fsd/public-api': 'off',
    },
  },
])
```

> [!TIP]
> If you want Steiger to ignore certain files, add an object like this to the config array:
>
> ```js
> defineConfig([, /* … */ { ignores: ['**/__mocks__/**'] }])
> ```

<details>
  <summary>Comprehensive showcase of the config file syntax</summary>
  
  ```javascript
    // ./steiger.config.ts
    import { defineConfig } from 'steiger'
    import fsd from '@feature-sliced/steiger-plugin'
    
    export default defineConfig([
      ...fsd.configs.recommended,
      {
        // ignore all mock files for all rules
        ignores: ['**/__mocks__/**'],
      },
      {
        files: ['./src/shared/**'],
        rules: {
          // disable public-api rule for files in /shared folder
          'fsd/public-api': 'off',
        },
      },
      {
        files: ['./src/widgets/**'],
        ignores: ['**/discount-offers/**'],
        rules: {
          // disable no-segmentless-slices rule for all widgets except /discount-offers
          'fsd/no-segmentless-slices': 'off',
        },
      },
    ])
  ```
  [You can see more examples here](CONFIG_EXAMPLES.md)
</details>

### Migration from 0.4.0

Version 0.5.0 introduced a new config file format. Follow the [instructions](MIGRATION_GUIDE.md) to migrate your config file.

## Rules

Currently, Steiger is not extendable with more rules, though that will change in the near future. The built-in rules check for the project's adherence to [Feature-Sliced Design](https://feature-sliced.design/).

<table>
<thead>
  <tr>
    <th>Rule</th>
    <th>Description</th>
  </tr>
</thead>
<tbody>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/ambiguous-slice-names/README.md"><code>fsd/ambiguous-slice-names</code></a></td> <td>Forbid slice names that that match some segment’s name in the Shared layer.</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/excessive-slicing/README.md"><code>fsd/excessive-slicing</code></a></td> <td>Forbid having too many ungrouped slices or too many slices in a group.</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/forbidden-imports/README.md"><code>fsd/forbidden-imports</code></a></td> <td>Forbid imports from higher layers and cross-imports between slices on the same layer.</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/inconsistent-naming/README.md"><code>fsd/inconsistent-naming</code></a></td> <td>Ensure that all entities are named consistently in terms of pluralization.</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/insignificant-slice/README.md"><code>fsd/insignificant-slice</code></a></td> <td>Detect slices that have just one reference or no references to them at all.</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/no-layer-public-api/README.md"><code>fsd/no-layer-public-api</code></a></td> <td>Forbid index files on the layer level.</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/no-public-api-sidestep/README.md"><code>fsd/no-public-api-sidestep</code></a></td> <td>Forbid going around the public API of a slice to import directly from an internal module in a slice.</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/no-reserved-folder-names/README.md"><code>fsd/no-reserved-folder-names</code></a></td> <td>Forbid subfolders in segments that have the same name as other conventional segments.</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/no-segmentless-slices/README.md"><code>fsd/no-segmentless-slices</code></a></td> <td>Forbid slices that don't have any segments.</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/no-segments-on-sliced-layers/README.md"><code>fsd/no-segments-on-sliced-layers</code></a></td> <td>Forbid segments (like ui, lib, api ...) that appear directly in sliced layer folders (entities, features, ...)</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/no-ui-in-app/README.md"><code>fsd/no-ui-in-app</code></a></td> <td>Forbid having the <code>ui</code> segment on the App layer.</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/public-api/README.md"><code>fsd/public-api</code></a></td> <td>Require slices (and segments on sliceless layers like Shared) to have a public API definition.</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/repetitive-naming/README.md"><code>fsd/repetitive-naming</code></a></td> <td>Ensure that all entities are named consistently in terms of pluralization.</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/segments-by-purpose/README.md"><code>fsd/segments-by-purpose</code></a></td> <td>Discourage the use of segment names that group code by its essence, and instead encourage grouping by purpose</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/shared-lib-grouping/README.md"><code>fsd/shared-lib-grouping</code></a></td> <td>Forbid having too many ungrouped modules in <code>shared/lib</code>.</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/typo-in-layer-name/README.md"><code>fsd/typo-in-layer-name</code></a></td> <td>Ensure that all layers are named without any typos.</td> </tr>
  <tr> <td><a href="./packages/steiger-plugin-fsd/src/no-processes/README.md"><code>fsd/no-processes</code></a></td> <td>Discourage the use of the deprecated Processes layer.</td> </tr>
</tbody>
</table>

## Contribution

Feel free to report an issue or open a discussion. Ensure you read our [Code of Conduct](CODE_OF_CONDUCT.md) first though :)

To get started with the codebase, see our [Contributing guide](CONTRIBUTING.md).

## Legal info

Project licensed under [MIT License](LICENSE.md). [Here's what it means](https://choosealicense.com/licenses/mit/)
