# Migration guide

## From 0.4.0 to 0.5.0

**Step 1**: First of all you need to make sure you upgraded Steiger package to version 0.5.0 or higher.

**Step 2**: You need to install `@feature-sliced/steiger-plugin` package (that contains all FSD rules to run checks in your project). Run one of the following commands based on the package manager you use.

**pnpm**:

```shell
pnpm add -D @feature-sliced/steiger-plugin
```

**yarn**:

```shell
yarn add -D @feature-sliced/steiger-plugin
```

**npm**:

```shell
npm i -D @feature-sliced/steiger-plugin
```

**Step 3**: The final step. You need to bring your `steiger.config.js` file to the new configuration format. You can do that automatically by running one of the following commands. (Alter the command before running if your config file has an extension different from `.js`)

Here is an example of the transformation that will be applied to your config:

<table><thead><tr>
<th>Before</th>
<th>After</th>
</tr></thead><tbody><tr><td>

```ts
// steiger.config.ts
import { defineConfig } from 'steiger'

export default defineConfig({
  rules: {
    'public-api': 'off',
    'ambiguous-slice-names': 'off',
    'nonexisting-rule': 'off',
  },
})
```

</td><td>

```ts
// steiger.config.ts
import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      'fsd/public-api': 'off',
      'fsd/ambiguous-slice-names': 'off',
      'nonexisting-rule': 'off',
    },
  },
])
```

</td></tr></tbody></table>

**! Don't forget to check the changes after the migration and bring them to the code style adopted in your project**

**pnpm**:

```shell
pnpx jscodeshift -t https://raw.githubusercontent.com/feature-sliced/steiger/codemod/packages/steiger/migrations/convert-config-to-flat.js steiger.config.js
```

**yarn**:

```shell
yarn dlx jscodeshift -t https://raw.githubusercontent.com/feature-sliced/steiger/codemod/packages/steiger/migrations/convert-config-to-flat.js steiger.config.js
```

**npm**:

```shell
npx jscodeshift -t https://raw.githubusercontent.com/feature-sliced/steiger/codemod/packages/steiger/migrations/convert-config-to-flat.js steiger.config.js
```
