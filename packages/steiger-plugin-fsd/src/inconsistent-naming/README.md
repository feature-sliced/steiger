# `inconsistent-naming`

This rule ensures that all entities are named consistently in terms of pluralization.

> [!WARNING]
> This rule is in early development. It currently assumes that the slice name is a single English word. In the future it will be able to understand more complex names like `images-of-cats`.

Example of a project structure that passes this rule:

```md
📂 entities
📂 users
📂 ui
📄 index.ts
📂 posts
📂 ui
📄 index.ts
```

Example of a project structure that fails this rule:

```md
📂 entities
📂 users // ❗️
📂 ui
📄 index.ts
📂 post // ❌
📂 ui
📄 index.ts
```

## Rationale

When existing entities are named inconsistently, the convention to name future entities becomes unclear, which leads to friction during code review.
