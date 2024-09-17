# `no-ui-in-app`

Forbid having <code>ui</code> segment in <code>app</code> layer.

Examples of project structures that pass this rule:

```
📂 shared
  📂 ui
    📄 index.ts
📂 pages
  📂 home
    📂 ui
    📄 index.ts
📂 app
  📂 providers
    📄 index.ts
```

Examples of project structures that fail this rule:

```
📂 shared
  📂 ui
    📄 index.ts
📂 pages
  📂 home
    📂 ui
    📄 index.ts
📂 app
  📂 providers
    📄 index.ts
  📂 ui  // ❌
    📄 index.ts
```

## Rationale

This layer is an entry point of the application, it handles global logic such as routing initialization, dependency injection, different providers, stores, etc. As for <code>ui</code> segment, it belongs to view part of the application and typically defined within pages, features, entities or other underlying layers.
