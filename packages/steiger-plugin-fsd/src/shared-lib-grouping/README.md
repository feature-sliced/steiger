# `shared-lib-grouping`

This rule forbids having too many ungrouped modules in `shared/lib`.

> [!NOTE]
> For now, the threshold has been set to 15 arbitrarily. If this rule is too strict or too lenient, please open an issue.

Examples of project structures that pass this rule:

```
📂 entities
  📂 users
    📂 ui
    📄 index.ts
  📂 posts
    📂 ui
    📄 index.ts
📂 shared
  📂 ui
    📄 index.ts
    📄 Button.tsx
```

```
📂 entities
  📂 users
    📂 ui
    📄 index.ts
  📂 posts
    📂 ui
    📄 index.ts
📂 shared
  📂 ui
    📄 index.ts
    📄 Button.tsx
  📂 lib
    📄 index.ts
    📄 dates.ts
    📄 collections.ts
```

(Cartoonish) Example of a project structure that fails this rule:

```
📂 entities
  📂 users
    📂 ui
    📄 index.ts
  📂 posts
    📂 ui
    📄 index.ts
📂 shared
  📂 ui
    📄 index.ts
    📄 Button.tsx
  📂 lib  // ❌
    📄 index.ts
    📄 dates.ts
    📄 collections.ts
    📄 utils.ts
    📄 helpers.ts
    📄 constants.ts
    📄 types.ts
    📄 api.ts
    📄 hooks.ts
    📄 selectors.ts
    📄 actions.ts
    📄 reducers.ts
    📄 sagas.ts
    📄 middleware.ts
    📄 components.ts
    📄 hell.ts
    📄 is.ts
    📄 other.ts
    📄 people.ts
```

## Rationale

The purpose of this rule is to prevent the `shared/lib` folder from becoming a dumping ground for all kinds of unrelated modules. This rule encourages developers to group related modules into their own folders, which makes it easier to find and understand the codebase.

Sergey Sova has [a little article](https://dev.to/sergeysova/why-utils-helpers-is-a-dump-45fo) about why folders like `utils` and `helpers` risk getting turned into a dump, and `shared/lib` is also a potential candidate for becoming a dump.
