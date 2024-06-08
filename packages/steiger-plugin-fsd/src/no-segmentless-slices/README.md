# `no-segmentless-slices`

Forbid slices that don't have any segments.

Examples of project structures that pass this rule:

```md
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

```md
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
  📂 home  // ❌ 
    📄 HomePage.tsx
```

## Rationale

Segments exist to separate the code inside a slice by its technical purpose. When a slice doesn't have this division, future growth of this slice becomes problematic, as people either won't be motivated to add this separation to avoid moving stuff around or they will add it and run up against Git conflicts and make the PR larger than necessary. When the slice grows and there's no separation by technical purpose, navigating this slice becomes more challenging.
