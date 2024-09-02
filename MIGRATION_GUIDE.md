# Migration guide

## From 0.4.0 to 0.5.0

**Step 1**: First of all you need to make sure you upgraded Steiger package to version 0.5.0 or higher.

**Step 2**: You need to install `@feature-sliced/steiger-plugin` package (that contains all FSD rules to run checks in your project). Run one of the following commands based on the package manager you use.

**pnpm**:

```shell
pnpm add @feature-sliced/steiger-plugin
```

**yarn**:

```shell
yarn add @feature-sliced/steiger-plugin
```

**npm**:

```shell
npm i @feature-sliced/steiger-plugin
```

**Step 3**: The final step. You need to bring your `steiger.config.js` file to the new configuration format. You can do that automatically by running one of the following commands.

**! Don't forget to check the changes after the migration and bring them to the code style adopted in your project**

**pnpm**:

```shell
pnpx jscodeshift -t https://raw.githubusercontent.com/feature-sliced/steiger/codemod/packages/steiger/migrations/convert-config-to-flat.js steiger.config.js
```

_yarn_:

```shell
yarn dlx  jscodeshift -t https://raw.githubusercontent.com/feature-sliced/steiger/codemod/packages/steiger/migrations/convert-config-to-flat.js steiger.config.js
```

_npm_:

```shell
npx jscodeshift -t https://raw.githubusercontent.com/feature-sliced/steiger/codemod/packages/steiger/migrations/convert-config-to-flat.js steiger.config.js
```
