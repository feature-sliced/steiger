# `segments-by-purpose`

Discourage the use of segment names that group code by its essence, and instead encourage grouping by purpose. For example, `useResizeObserver` and `useQuery` are both React hooks, but they serve a very different purpose, one is for UI and the other is for data fetching. Grouping them together under a `hooks` segment would be unhelpful to someone who's searching for code that makes API requests.

To pass this rule, avoid using the following segment names:

- `utils`
- `helpers`
- `hooks`
- `modals`
- `components`

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

## Rationale

Segments group code by technical purpose, and the reason for that grouping is to make it easier to find things in a slice. Usually, when we are searching for code, we know at least broadly if we're looking for code that works with the API, or a display component, or a data store. Folders `components` may sound like they only contain UI components, but there are other things that affect UI, like date formatters, hooks for browser APIs, and so on, that are not components. They share the same purpose as components, so they should be grouped together under a semantic name. Folders `hooks` are problematic mostly because a hook is an abstract concept of a function, it doesn't tell anything about what that function can and can't do, so this name is no better than `functions`.

Additionally, Sergey Sova has [a little article](https://dev.to/sergeysova/why-utils-helpers-is-a-dump-45fo) about why folders like `utils` and `helpers` risk getting turned into a dump.
