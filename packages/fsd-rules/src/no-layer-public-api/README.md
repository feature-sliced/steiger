# `no-layer-public-api`

Forbid index files on the layer level. 

According to the _public API rule on slices_:

> Every slice (and segment on layers that don't have slices) must contain a public API definition.
> 
> Modules outside of this slice/segment can only reference the public API, not the internal file structure of the slice/segment.
> https://feature-sliced.design/docs/reference/slices-segments#public-api-rule-on-slices

A corollary to this rule is that the layer itself should not have an index file.

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
  📄 index.ts // ❌
📂 entities
  📂 user
    📂 ui
    📄 index.ts
📂 pages
  📂 home
    📂 ui
    📄 index.ts
  📂 editor
    📂 ui
    📄 index.ts
  📄 index.ts // ❌
```
