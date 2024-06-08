# Steiger

Universal file structure and project architecture linter.

> [!NOTE]
> The project is in beta and in active development. Some APIs may change.

# Features

- Built-in set of rules to validate adherence to [Feature-Sliced Design](https://feature-sliced.design/)
- Watch mode
- Rule configurability

# Installation

```bash
npm i -D steiger
```

# Usage

```bash
steiger ./src
```

To run in watch mode, add `-w`/`--watch` to the command:

```bash
steiger ./src --watch
```

# Configuration

Steiger is configurable via `cosmiconfig`. That means that you can create a `steiger.config.ts` or `steiger.config.js` file in the root of your project to configure the rules. Import `{ defineConfig } from "steiger"` to get autocompletion.

```ts
import { defineConfig } from 'steiger'

export default defineConfig({
  rules: {
    'no-public-api': 'off',
  },
})
```

# Contribution

Feel free to report an issue or open a discussion. Ensure you read the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md) first though :)

# Legal info

Project licensed under [MIT License](LICENSE.md). [Here's what it means](https://choosealicense.com/licenses/mit/)
