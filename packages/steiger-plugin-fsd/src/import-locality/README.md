# `import-locality`

Require that imports from the same slice be relative and imports from one slice to another be absolute.

For example, `entities/user/ui/Avatar.tsx` should use relative imports when importing from `entities/user/ui/Avatar.styles.ts`, but use absolute imports when importing from `shared/ui`.

Aliases are considered absolute imports, so setting up an alias is a nice way to do absolute imports.

Example of a file whose imports pass this rule:

```ts
// entities/user/ui/Avatar.tsx
import classes from './Avatar.styles'
import { shadows } from '@/shared/ui'
```

Examples of files whose imports violate this rule:

```ts
// entities/user/ui/Avatar.tsx
import classes from '@/entities/user/ui/Avatar.styles.ts'
```

```ts
// entities/user/ui/Avatar.tsx
import classes from '@/entities/user'
```

```ts
// entities/user/ui/Avatar.tsx
import { shadows } from '../../../shared/ui'
```

## Rationale

Imports between slices should be absolute to stay stable during refactors. If you change the folder structure inside your slice, imports from other slices should not change.

Imports within a slice should not be absolute because having them absolute leads to one of the following cases:

1. If the team wants to keep imports short (i.e. only `@/entities/user`), this leads to everything internal being exposed in the public API of the slice.
2. If the public API is kept to the necessary minimum, imports become unnecessarily longer because they include the layer, slice, and segment names. Usually the folder tree in a slice is not too deep, so relative imports will be short and also stable during slice renames.
