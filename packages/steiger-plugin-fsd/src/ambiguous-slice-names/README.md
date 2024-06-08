# `ambiguous-slice-names`

Forbid slice names that that match some segment’s name in the Shared layer. For example, if you have a folder `shared/i18n`, this rule forbids having an entity or feature with the name `i18n`.

Examples of project structures that pass this rule:

```md
📂 shared
📂 ui
📄 index.ts
📂 i18n
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
📂 i18n // ❗️
📄 index.ts
📂 entities
📂 user
📂 ui
📂 model
📄 index.ts
📂 features
📂 i18n // ❌
📂 ui
📄 index.ts
📂 pages
📂 home
📂 ui
📄 index.ts
```

## Rationale

When there is a segment in shared with the same name as a slice, it becomes ambiguous where new code should be written, and also obscures the search for code.
