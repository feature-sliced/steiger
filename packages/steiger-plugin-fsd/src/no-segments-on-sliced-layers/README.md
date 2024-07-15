# `no-segmentless-slices`

Forbid segments that appear in direct children of sliced layers.

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
  📂 api // ❌
    📄 index.ts
📂 pages
   📂 home
     📂 ui
     📄 index.ts
```

## Rationale

Several folder names like `ui` or `api` are conventionally understood in FSD as segments. When you have segments as direct children, it's either because that's the name you chose for your slice, or because some code ended up unsliced. In the first case, where that is the name of your slice, such a name is likely to cause confusion among developers who are familiar with FSD. In the second case, where a segment on a layer is because there was no slice to put it in, it's a violation of FSD structure, which decreases the benefits of FSD and also causes confusion.
