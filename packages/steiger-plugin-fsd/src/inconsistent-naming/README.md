# `inconsistent-naming`

This rule ensures that all entities are named consistently in terms of pluralization.

For names that consist of multiple words, the pluralization of the main subject is considered. For example:

- in `a book with pages`, the main subject is `book`, singular
- in `admin-users`, the main subject is `users`, plural
- in `receiptsByOrder`, the main subject is `receipts`, plural

Uncountable nouns like "firmware" are not counted as either singular or plural.

Example of a project structure that passes this rule:

```
📂 entities
  📂 users
    📂 ui
    📄 index.ts
  📂 posts
    📂 ui
    📄 index.ts
```

Example of a project structure that fails this rule:

```
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
