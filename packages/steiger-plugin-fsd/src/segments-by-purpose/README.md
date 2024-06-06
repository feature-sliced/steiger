# `segments-by-purpose`

Discourage the use of segment names that group code by its essence, and instead encourage grouping by purpose. For example, `useResizeObserver` and `useQuery` are both React hooks, but they serve a very different purpose, one is for UI and the other is for data fetching. Grouping them together under a `hooks` segment would be unhelpful to someone who's searching for code that makes API requests.

To pass this rule, avoid using the following segment names:
  - `utils`
  - `helpers`
  - `hooks`
  - `modals`
  - `components`

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
```
📂 shared
  📂 ui
    📄 index.ts
  📂 modals  // ❌
    📄 index.ts
  📂 hooks  // ❌
    📄 index.ts
  📂 helpers  // ❌
    📄 index.ts
  📂 utils  // ❌
    📄 index.ts
📂 entities
  📂 user
    📂 components  // ❌
    📂 model
    📄 index.ts
📂 pages
  📂 home
    📂 ui
    📄 index.ts
```
