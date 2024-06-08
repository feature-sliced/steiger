# `no-reserved-folder-names`

Forbid subfolders in segments that have the same name as other conventional segments. For example, `shared/ui/lib` is a folder inside `shared/ui` that has a name of a conventional segment `lib`, which might cause confusion about the segment structure.

This rule forbids the following names:

- `ui`
- `model`
- `api`
- `lib`
- `config`

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

## Rationale

While segment names aren't strictly regulated by Feature-Sliced Design, there is a number of conventional segment names that are widely recognized from project to project. Seeing these folder names might lead people to believe that they are looking at a slice, while in reality, they are looking at a subfolder of a slice. To maintain predictable project structure, we disallow naming internal folders with conventional segment names.
