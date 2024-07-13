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

Slices exist to partition code by business domain and entities. You can freely create and name them (e.g. `pages` home, profile and `entities` user, product, ...) based on your needs, application logic, company glossary, etc. Slices contain code of different type/purposes (segments) to implement their part of functionality. Segments (`ui`, `lib`, `api`) are simply a division of code by purpose, thus "ownerless" segments in sliced layers are not allowed since they need to be attached to some part of the business domain inside these layers.
