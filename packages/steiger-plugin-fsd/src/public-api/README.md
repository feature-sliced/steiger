# `public-api`

Require slices (and segments on Shared) to have a public API definition.

According to the _public API rule on slices_:

> Every slice (and segment on layers that don't have slices) must contain a public API definition.
>
> Modules outside of this slice/segment can only reference the public API, not the internal file structure of the slice/segment.
> https://fsd.how/docs/reference/slices-segments#public-api-rule-on-slices

Examples of project structures that pass this rule:

```
📂 shared
  📂 ui
    📄 index.ts
  📂 lib
    📄 index.ts
📂 entities
  📂 user
    📂 ui
    📂 model
    📄 index.ts
📂 pages
  📂 home
    📂 ui
    📄 index.ts
```

Examples of project structures that fail this rule:

```
📂 shared
  📂 ui  // ❌
    📄 Button.tsx
  📂 lib
    📄 index.ts
📂 entities
  📂 user  // ❌
    📂 ui
    📂 model
📂 pages
  📂 home
    📂 ui
    📄 index.ts
```

## Rationale

The public API for slices exists as the only entrypoint into a slice, and that ensures that the internal structure of the slice can change freely as long as the public API stays the same. This ensures stability of the codebase during refactors. A slice that doesn't have one becomes a weak point for refactoring.
