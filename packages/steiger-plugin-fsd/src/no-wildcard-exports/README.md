# `no-wildcard-exports`

Forbid wildcard re-exports (`export * from`) in public APIs.

According to the _public API rule on slices_:

> Every slice (and segment on layers that don't have slices) must contain a public API definition.
>
> Modules outside of this slice/segment can only reference the public API, not the internal file structure of the slice/segment.
> https://feature-sliced.design/docs/reference/slices-segments#public-api-rule-on-slices

The FSD documentation lists wildcard re-exports as bad practice:

> This hurts the discoverability of a slice because you can't easily tell what the interface of this slice is.
> https://feature-sliced.design/docs/reference/public-api#what-makes-a-good-public-api

This rule checks every public API file on every layer, including index variants like `index.client.ts` and `index.server.ts`. It skips every other file, because a wildcard export inside a module stays private to the slice or segment that contains it.

Namespace re-exports (`export * as ns from`) are allowed. They add one name to the public API, so a reader can still tell what the module exports.

Examples of public APIs that pass this rule:

```ts
// entities/user/index.ts
export { UserCard } from './ui/UserCard'
export { type User, useUser } from './model/user'
```

```ts
// shared/ui/index.ts
export { Form, Field } from './form'
export * as positions from './tooltip-positions'
```

Examples of public APIs that fail this rule:

```ts
// entities/user/index.ts
export * from './ui/UserCard' // ❌
export * from './model/user' // ❌
```

```ts
// shared/ui/index.ts
export { Form, Field } from './form'
export * from './tooltip-positions' // ❌
```

## Rationale

A wildcard re-export hides the public API of a group of modules, so you can't tell what a slice exports without opening every file inside it.

It also lets the public API change by accident. Adding an export to an internal module adds it to the public API too, and removing that export later breaks whoever started using it. Listing the names means the public API only changes when someone edits the index file.
