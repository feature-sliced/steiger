# `no-processes`

Discourage the use of the deprecated Processes layer.

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
📂 processes // ❌
  📂 cart
```

## Rationale

The Processes layer was deprecated because there weren't enough use cases to justify its exitsence.

If your project has this layer, consider moving the code from this layer into App or Features.
