# `no-wildcard-exports`

Forbid wildcard exports (`export *`) in public APIs of business logic layers. Named exports and namespace exports (`export * as namespace`) are allowed.

**Exception:** Wildcard exports are allowed in unsliced layers (`shared` and `app`), as they serve as foundational layers with different architectural purposes.

This rule treats files named `index.js`, `index.jsx`, `index.ts`, `index.tsx` as the public API of a folder (slice/segment root). Non-index files (including test files like `*.spec.ts`, `*.test.ts`) are ignored.

Examples of exports that pass this rule:

```ts
// Named exports (business logic layers)
export { Button } from './Button'
export { UserCard, UserAvatar } from './components'

// Namespace exports (all layers)
export * as userModel from './model'
export * as positions from './tooltip-positions'

// Wildcard exports (unsliced layers: shared, app)
// shared/ui/index.ts
export * from './Button'
export * from './Modal'
export * from './Input'

// shared/api/index.ts
export * from './endpoints/auth'
export * from './endpoints/users'

// app/providers/index.ts
export * from './AuthProvider'
export * from './ThemeProvider'
export * from './RouterProvider'
```

Examples of exports that fail this rule:

```ts
// ❌ Wildcard exports in business logic layers
// entities/user/index.ts
export * from './model'
export * from './ui'

// features/auth/index.ts
export * from './ui'
export * from './api'
```

## Rationale

Wildcard exports in business logic layers make it harder to track which exact entities are being exported from a module. This can lead to:

- Unintentionally exposing internal implementation details
- Difficulty in tracking dependencies between modules
- Potential naming conflicts when multiple modules use wildcard exports

Using named exports or namespace exports makes the public API more explicit and easier to maintain in business logic layers.

## Autofix

This rule provides a suggested fix for wildcard exports in public API files by replacing them with a named export template (e.g. `export { ComponentA, ComponentB } from './components'`).
