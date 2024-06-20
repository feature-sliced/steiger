# `no-file-segments`

Discourage the usage of file segments, suggesting folder segments instead.

Example of a project structure that passes this rule:

```
📂 shared
  📂 ui
    📄 styles.ts
    📄 Button.tsx
    📄 TextField.tsx
    📄 index.ts
📂 pages
  📂 editor
    📂 ui
      📄 EditorPage.tsx
      📄 Editor.tsx
    📄 index.ts
```

Examples of project structures that violate this rule:

```
📂 shared
  📂 ui
    📄 styles.ts
    📄 Button.tsx
    📄 TextField.tsx
    📄 index.ts
📂 features
  📂 comments
    📄 ui.tsx // ❌
    📄 index.ts
📂 pages
  📂 editor
    📄 ui.tsx // ❌
    📄 index.ts
  📂 settings
    📂 ui
      📄 SettingsPage.tsx
    📄 index.ts
```

```
📂 shared
  📄 routes.ts // ❌
  📂 ui
    📄 styles.ts
    📄 Button.tsx
    📄 TextField.tsx
    📄 index.ts
📂 entities
  📂 user
    📂 ui
      📄 UserAvatar.tsx
    📄 index.ts
  📂 product
    📂 ui
      📄 ProductCard.tsx
    📄 index.ts
📂 features
  📂 comments
    📂 ui
      📄 CommentCard.tsx
    📄 index.ts
📂 pages
  📂 editor
    📂 ui
      📄 EditorPage.tsx
      📄 Editor.tsx
    📄 index.ts
```

## Rationale

File segments are limited in their growth potential because everything has to be put in one file. This can get in the way of using this segment in the future for adjacent purposes. In this way, folder segments are better for the project long-term.
