# Contributing

To start with this project, you will need [pnpm 9](https://pnpm.io). Install the dependencies with `pnpm i` in the root.

This project is a monorepo of the following packages:

- `packages/steiger` — the linter itself
- `packages/steiger-plugin-fsd` — a set of rules for checking FSD compliance
- `packages/pretty-reporter` — a reporter for the linter to print diagnostics
- `tooling/eslint-config` — a shared ESLint configuration
- `tooling/tsconfig` — a shared TypeScript configuration

Packages `steiger` and `steiger-plugin-fsd` are published to npm, the rest are internal.

> [!NOTE]
> The package `steiger-plugin-fsd` is published as `@feature-sliced/steiger-plugin`.

The tasks in this monorepo are managed with [Turborepo 2](https://turbo.build/repo). It is available in this project as `pnpm turbo`, but you should also consider installing it globally for easier use:

```bash
pnpm install turbo --global
```

Here are some of the things you can do around the repo:

- `turbo build` — build all packages
- `turbo test` — run tests for all packages
- `turbo lint` — lint all packages with ESLint
- `turbo typecheck` — type-check all packages
- `pnpm check-monorepo` — check the monorepo structure with Manypkg

## Versioning

This project uses Changesets for versioning. When you made changes, run `pnpm changeset` in the root to create a new changeset and add that to your PR.

<details>
  <summary>For maintainers</summary>

When it's time to release new versions of packages to npm, run the following commands:

```bash
pnpm changeset version
pnpm changeset publish
```

</details>
