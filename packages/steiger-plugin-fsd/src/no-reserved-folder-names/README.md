## `no-reserved-folder-names`

Forbid subfolders in segments that have the same name as other conventional segments. For example, `shared/ui/lib` is a folder inside `shared/ui` that has a name of a conventional segment `lib`, which might cause confusion about the segment structure.

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
    📂 lib // ❌
      📄 someUiFunction.ts
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
