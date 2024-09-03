# Examples

## Structure and concepts

There are 3 types of config objects that you can put in your config file. They follow 2 purposes: registration and configuration.

- Plugin - allows you to register a plugin that provides rules to run. (We will consider this one in more detail in a later section)
- Config Object - allows you to configure the behaviour of rules provided by the plugins. It has the following shape:
  ```text
  {
  	"files"?: <GlobArray>,
  	"ignores"?: <GlobArray>,
  	"rules": {
  		<RuleName>: <Severity> | [<Severity>, <RuleOptions>]
  	}
  }
  ```
  ```javascript
  export default defineConfig({
    files: ['./src/shared/**'],
    ignores: ['./src/shared/__mocks__/**'],
    rules: {
      'fsd/no-public-api': 'off',
      'fsd/forbidden-imports': ['warn', { someOption: false }],
    },
  })
  ```
- Global ignore - allows you to disable all rules for a specific part of the file system.
  ```text
  {
  	ignores: <GlobArray>
  }
  ```
  ```javascript
  export default defineConfig([
    ...fsd.configs.recommended,
    {
      ignores: ['./src/shared/__mocks__/**'],
    },
  ])
  ```

Parts of the config object:

- Severity - can be one of the following: "off", "warn", "error"
- GlobArray - string array with glob patterns to match files and folders in your project.
- RuleOptions - an object that contains specific rule options and can be passed to the rule to configure its behavior.

## Examples

Here are some rules on how configuration is processed:

- Config objects are processed from top to bottom, so if there are multiple config object that match the same file for the same rule, the last one will be applied.
- You can set options for a rule once. When set, options are applied for the entire file system that is covered by Steiger.

Note that this line `...fsd.configs.recommended,` just takes the plugin and the recommended rules configuration (all enabled with "error" severity by default) and puts it into the config array.

### Example 1. Default case

```javascript
// ./steiger.config.ts
import fsd from '@feature-sliced/steiger-plugin'
import defineConfig from 'steiger'

export default defineConfig([...fsd.configs.recommended])
```

### Example 2. FSD with all rules enabled by default, but excluding a couple of folders

```javascript
import fsd from '@feature-sliced/steiger-plugin'
import defineConfig from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: ['**/__mocks__/**'],
  },
])
```

### Example 3. FSD without certain rules.

```javascript
import fsd from '@feature-sliced/steiger-plugin'
import defineConfig from 'steiger'

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

### Example 4. Disabling a rule for files in a specific folder and the folder itself.

```javascript
import fsd from '@feature-sliced/steiger-plugin'
import defineConfig from 'steiger'

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

### Example 5. Using ignores along with files.

```javascript
import fsd from '@feature-sliced/steiger-plugin'
import defineConfig from 'steiger'

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

### Example 6. Setting rule options.

```javascript
import fsd from '@feature-sliced/steiger-plugin'
import defineConfig from 'steiger'

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
