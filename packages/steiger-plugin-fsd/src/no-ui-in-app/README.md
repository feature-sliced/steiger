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

This layer is an entry point of the application, it handles global logic such as routing initialization, dependency injection, different providers, stores, etc. As for the <code>ui</code> segment, it belongs to the "view" part of the application and is typically present in the layers below, for example, <code>pages</code>, <code>features</code>, <code>entities</code>.
As one possible exception, <code>ui</code> segment can be used in <code>app</code> layer if the entire application consists of only one page and there is no any reasons to define <code>pages</code> layer.
