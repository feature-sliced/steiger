# Examples

## Example 1. Default case

```javascript
// ./steiger.config.ts
import fsd from '@feature-sliced/steiger-plugin'
import defineConfig from 'steiger'

export default defineConfig([...fsd.configs.recommended])
```

## Example 2. FSD with all rules enabled by default, but excluding a couple of folders

```javascript
import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: ['**/__mocks__/**'],
  },
])
```

## Example 3. FSD without certain rules.

```javascript
import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      'fsd/no-processes': 'off',
      'fsd/no-public-api-sidestep': 'warn',
    },
  },
  {
    files: ['./src/shared/**'],
    rules: {
      'fsd/public-api': 'off',
    },
  },
])
```

## Example 4. Disabling a rule for files in a specific folder and the folder itself.

```javascript
import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    files: ['./src/shared', './src/shared/**'],
    rules: {
      'fsd/no-public-api': 'off',
    },
  },
])
```

## Example 5. Using ignores along with files.

```javascript
import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    files: ['./src/shared', './src/shared/**'],
    ignores: ['./src/shared/lib/**', './src/shared/ui/**'],
    rules: {
      'fsd/no-public-api': 'off', // Disable the rule for the shared folder, but not for the lib and ui folders
    },
  },
])
```

## Example 6. Setting rule options.

```javascript
import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      'fsd/no-public-api': ['warn', { someOptions: true }],
    },
  },
  {
    files: ['./src/shared/**'],
    rules: {
      'fsd/no-public-api': ['error', { someOptions: false }], // Would throw an error as you can't override the options
    },
  },
])
```
