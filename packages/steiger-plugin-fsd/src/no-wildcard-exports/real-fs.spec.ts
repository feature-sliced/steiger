import * as fs from 'node:fs/promises'
import os from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, expect, it } from 'vitest'

import { parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'
import noWildcardExports from './index.js'

/**
 * The other spec of this rule mocks `node:fs`. This one runs the rule against real files on disk, so
 * the rule reads and parses the project the same way it does when Steiger runs.
 */
const project = await fs.mkdtemp(join(await fs.realpath(os.tmpdir()), 'no-wildcard-exports-'))

afterAll(() => fs.rm(project, { recursive: true, force: true, maxRetries: 3 }))

async function writeFile(relativePath: string, content: string) {
  const path = join(project, ...relativePath.split('/'))
  await fs.mkdir(dirname(path), { recursive: true })
  await fs.writeFile(path, content, 'utf8')
}

await Promise.all([
  writeFile('src/shared/ui/Button.tsx', 'export function Button() {}\n'),
  writeFile('src/shared/ui/tooltip-positions.ts', "export const top = 'top'\n"),
  writeFile(
    'src/shared/ui/index.ts',
    "export { Button } from './Button'\nexport * as positions from './tooltip-positions'\n",
  ),
  writeFile('src/entities/user/ui/UserCard.tsx', 'export function UserCard() {}\n'),
  writeFile('src/entities/user/model/user.ts', "export * from './session'\n"),
  writeFile('src/entities/user/index.ts', "export * from './ui/UserCard'\n"),
])

it('reports wildcard exports in a project on disk', async () => {
  const root = parseIntoFsdRoot(
    `
      📂 shared
        📂 ui
          📄 Button.tsx
          📄 tooltip-positions.ts
          📄 index.ts
      📂 entities
        📂 user
          📂 ui
            📄 UserCard.tsx
          📂 model
            📄 user.ts
          📄 index.ts
    `,
    join(project, 'src'),
  )

  expect((await noWildcardExports.check(root)).diagnostics).toEqual([
    {
      message: `Wildcard export from "./ui/UserCard" hides the public API. List the exported names instead.`,
      location: {
        path: join(project, 'src', 'entities', 'user', 'index.ts'),
        start: { line: 1, column: 1 },
        end: { line: 1, column: 30 },
      },
    },
  ])
})
