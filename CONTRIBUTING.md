# Contributing

To start with this project, you will need [pnpm 10](https://pnpm.io). Install the dependencies with `pnpm i` in the root.

This project is a monorepo of the following packages:

- `packages/steiger` — the linter itself, published to npm as `steiger`
- `packages/steiger-plugin-fsd` — a set of rules for checking FSD compliance, published to npm as `@feature-sliced/steiger-plugin`
- `packages/language-server` — the language server, published to npm as `@feature-sliced/language-server`
- `packages/toolkit` — a toolkit for writing rules for Steiger, published to npm as `@steiger/toolkit`
- `packages/pretty-reporter` — an internal reporter for the linter to print diagnostics
- `packages/types` — internal type definitions
- `integration-tests` — integration tests for the linter
- `tooling/eslint-config` — a shared ESLint configuration
- `tooling/tsconfig` — a shared TypeScript configuration

All packages not mentioned above as published are internal.

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

Releases are automated with the `Release` workflow (see `.github/workflows/release.yml`):

- Merges to `master` that contain changesets update an always-open `Version Packages` pull request, which accumulates all pending releases.

- Whenever you want to release (in bulk or per change), merge that pull request: every package with pending changesets is published to npm (together with patch releases of their internal dependents), tagged as `name@version`, and given its own GitHub Release with its changelog.

</details>
