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

It's uncommon to define the `ui` segment on the App layer. The App layer is typically used to combine the application into a single entry point. The UI of your application should already be created on the layers below to avoid mixing up responsibilities. Therefore, the `ui` segment on the App layer is typically a mistake. 

For example, context providers are components, but they are not UI. Global styles are technically UI, but they aren't scoped to that segment, so the name `ui` might be a misdirection.

As one possible exception, the `ui` segment can be used on the App layer if the entire application consists of only one page and there is no reason to define the Pages layer.
