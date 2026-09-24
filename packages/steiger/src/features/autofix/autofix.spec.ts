import * as fs from 'node:fs/promises'
import os from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { Fix, PartialDiagnostic } from '@steiger/types'

import { applyAutofixes } from './autofix'

let project: string

beforeEach(async () => {
  project = await fs.mkdtemp(join(os.tmpdir(), 'steiger-autofix-'))
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(async () => {
  vi.restoreAllMocks()
  await fs.rm(project, { recursive: true, force: true })
})

function diagnostic(fixes: Array<Fix>): PartialDiagnostic {
  return { message: 'test', location: { path: project }, fixes }
}

async function write(path: string, content: string) {
  await fs.mkdir(join(project, path, '..'), { recursive: true })
  await fs.writeFile(join(project, path), content)
}

const read = (path: string) => fs.readFile(join(project, path), 'utf8')

it('merges the edits that different diagnostics make in the same file', async () => {
  await write('app.ts', 'aaa bbb\n')

  const stillRelevant = await applyAutofixes([
    diagnostic([
      { type: 'edit-file', path: join(project, 'app.ts'), edits: [{ start: 0, end: 3, replacement: 'xx' }] },
    ]),
    diagnostic([
      { type: 'edit-file', path: join(project, 'app.ts'), edits: [{ start: 4, end: 7, replacement: 'yy' }] },
    ]),
  ])

  expect(stillRelevant).toEqual([])
  expect(await read('app.ts')).toBe('xx yy\n')
})

it('edits files before renaming the folders that contain them', async () => {
  await write('pages/homePage/index.ts', 'old\n')

  const stillRelevant = await applyAutofixes([
    diagnostic([
      // The rename is listed first on purpose: the executor has to work out the order itself.
      { type: 'rename', path: join(project, 'pages', 'homePage'), newName: 'home' },
      {
        type: 'edit-file',
        path: join(project, 'pages', 'homePage', 'index.ts'),
        edits: [{ start: 0, end: 3, replacement: 'new' }],
      },
    ]),
  ])

  expect(stillRelevant).toEqual([])
  expect(await read('pages/home/index.ts')).toBe('new\n')
})

it('renames deeper folders before the folders that contain them', async () => {
  await write('pages/groupOld/homePage/index.ts', '')

  const stillRelevant = await applyAutofixes([
    diagnostic([
      { type: 'rename', path: join(project, 'pages', 'groupOld'), newName: 'group' },
      { type: 'rename', path: join(project, 'pages', 'groupOld', 'homePage'), newName: 'home' },
    ]),
  ])

  expect(stillRelevant).toEqual([])
  expect(await read('pages/group/home/index.ts')).toBe('')
})

it('applies a rename that two diagnostics agree on exactly once', async () => {
  await write('entities/user/index.ts', '')

  const stillRelevant = await applyAutofixes([
    diagnostic([{ type: 'rename', path: join(project, 'entities', 'user'), newName: 'client' }]),
    diagnostic([{ type: 'rename', path: join(project, 'entities', 'user'), newName: 'client' }]),
  ])

  expect(stillRelevant).toEqual([])
  expect(await read('entities/client/index.ts')).toBe('')
})

it('rejects a modify-file and an edit-file of the same file without touching anything', async () => {
  await write('app.ts', 'original\n')
  const diagnostics = [
    diagnostic([{ type: 'modify-file', path: join(project, 'app.ts'), content: 'replaced\n' }]),
    diagnostic([
      { type: 'edit-file', path: join(project, 'app.ts'), edits: [{ start: 0, end: 8, replacement: 'edited' }] },
    ]),
  ]

  const stillRelevant = await applyAutofixes(diagnostics)

  expect(stillRelevant).toEqual(diagnostics)
  expect(await read('app.ts')).toBe('original\n')
})

it('rejects two renames of the same folder to different names without touching anything', async () => {
  await write('entities/user/index.ts', '')
  const diagnostics = [
    diagnostic([{ type: 'rename', path: join(project, 'entities', 'user'), newName: 'users' }]),
    diagnostic([{ type: 'rename', path: join(project, 'entities', 'user'), newName: 'client' }]),
  ]

  const stillRelevant = await applyAutofixes(diagnostics)

  expect(stillRelevant).toEqual(diagnostics)
  expect(await read('entities/user/index.ts')).toBe('')
})

it('rejects two renames that would produce the same destination without touching anything', async () => {
  await write('entities/user/index.ts', 'a\n')
  await write('entities/usersPage/index.ts', 'b\n')
  const diagnostics = [
    diagnostic([{ type: 'rename', path: join(project, 'entities', 'user'), newName: 'users' }]),
    diagnostic([{ type: 'rename', path: join(project, 'entities', 'usersPage'), newName: 'users' }]),
  ]

  const stillRelevant = await applyAutofixes(diagnostics)

  expect(stillRelevant).toEqual(diagnostics)
  expect(await read('entities/user/index.ts')).toBe('a\n')
  expect(await read('entities/usersPage/index.ts')).toBe('b\n')
})

it('rejects a rename that targets the source of another rename without touching anything', async () => {
  // Running the second rename first leaves user free to take the users slot; running it last
  // makes it fail. The executor refuses the pair rather than picking one of those outcomes.
  await write('entities/user/index.ts', 'a\n')
  await write('entities/users/index.ts', 'b\n')
  const diagnostics = [
    diagnostic([{ type: 'rename', path: join(project, 'entities', 'user'), newName: 'users' }]),
    diagnostic([{ type: 'rename', path: join(project, 'entities', 'users'), newName: 'clients' }]),
  ]

  const stillRelevant = await applyAutofixes(diagnostics)

  expect(stillRelevant).toEqual(diagnostics)
  expect(await read('entities/user/index.ts')).toBe('a\n')
  expect(await read('entities/users/index.ts')).toBe('b\n')
})

it('rejects overlapping edits of the same file without touching anything', async () => {
  await write('app.ts', 'abcdef\n')
  const diagnostics = [
    diagnostic([{ type: 'edit-file', path: join(project, 'app.ts'), edits: [{ start: 0, end: 4, replacement: 'x' }] }]),
    diagnostic([{ type: 'edit-file', path: join(project, 'app.ts'), edits: [{ start: 2, end: 6, replacement: 'y' }] }]),
  ]

  const stillRelevant = await applyAutofixes(diagnostics)

  expect(stillRelevant).toEqual(diagnostics)
  expect(await read('app.ts')).toBe('abcdef\n')
})

it('keeps the earlier phases applied when a later fix fails (fixes are ordered, not transactional)', async () => {
  // This pins the current behavior rather than promising it: the fixable diagnostics are reported as
  // still relevant, but the file edits that ran before the failing rename stay on disk.
  await write('pages/homePage/index.ts', '')
  await write('pages/home/taken.ts', '')
  await write('app.ts', "import '@/pages/homePage'\n")

  const diagnostics = [
    diagnostic([
      { type: 'edit-file', path: join(project, 'app.ts'), edits: [{ start: 16, end: 24, replacement: 'home' }] },
      // Fails: the target of the rename already exists and is not empty.
      { type: 'rename', path: join(project, 'pages', 'homePage'), newName: 'home' },
    ]),
  ]

  const stillRelevant = await applyAutofixes(diagnostics)

  expect(stillRelevant).toEqual(diagnostics)
  expect(await read('app.ts')).toBe("import '@/pages/home'\n")
  expect(await read('pages/homePage/index.ts')).toBe('')
})
