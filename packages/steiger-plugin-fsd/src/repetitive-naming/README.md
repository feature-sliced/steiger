# `repetitive-naming`

Discourage repetitive parts in slice names (e.g. adding page to every slice on Pages).

Examples of project structures that pass this rule:
```
📂 pages
  📂 home
    📂 ui
    📄 index.ts
  📂 about
    📂 ui
    📄 index.ts
  📂 contact
    📂 ui
    📄 index.ts
```

Examples of project structures that fail this rule:
```
📂 pages
  📂 homePage  // ❌
    📂 ui
    📄 index.ts
  📂 aboutPage  // ❌
    📂 ui
    📄 index.ts
  📂 contactPage  // ❌
    📂 ui
    📄 index.ts
```

## Rationale

Suffixes that appear in the name every slice don't add much meaning and instead get in the way of understanding the difference between the slices.
