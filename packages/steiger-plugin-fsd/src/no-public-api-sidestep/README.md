# `no-public-api-sidestep`

Forbid going around the public API of a slice to import directly from an internal module in a slice.

Examples of imports that satisfy this rule:

```ts
import { Button } from '@/shared/ui'
import { formatForHumans } from '@/shared/lib/dates' // shared/ui and shared/lib may have indexes one layer deeper
import { translator } from '@/shared/i18n'
import { UserAvatar } from '@/entities/user'
import { UserAvatar } from '@/entities/user/@x/product'
import { EditorPage } from '@/pages/editor'
```

Examples of imports that violate this rule:

```ts
import { translator } from '@/shared/i18n/translator'
import { buttonStyles } from '@/shared/ui/button/styles'
import { UserAvatar } from '@/entities/user/ui/UserAvatar'
import { EditorPage } from '@/pages/editor/ui/EditorPage'
```

## Rationale

The public API for slices exists as the only entrypoint into a slice, and that ensures that the internal structure of the slice can change freely as long as the public API stays the same. This ensures stability of the codebase during refactors. By sidestepping the public API, you are creating a direct dependency on the internal structure of the slice, which can lead to issues when the internal structure changes.
