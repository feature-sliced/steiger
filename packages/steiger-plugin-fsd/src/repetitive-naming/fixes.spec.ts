import { sep } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import type { Fix, Folder, PartialDiagnostic } from '@steiger/toolkit'
import { applyTextEdits } from '@steiger/toolkit'
import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'

vi.mock('tsconfck', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('tsconfck')>()),
    parse: vi.fn(() => Promise.resolve({ tsconfig: { compilerOptions: { paths: { '@/*': ['/*'] } } } })),
  }
})

// Each scenario uses its own slice names, so that the flat mock file system can hold all of them at
// once without two tests ever sharing a path.
const files: Record<string, string> = {
  // Plain trailing suffix in camelCase, referenced through an alias from another layer.
  '/pages/homePage/index.ts': 'export { Home } from "./ui/Home"',
  '/pages/homePage/ui/Home.tsx': 'export const Home = () => null',
  '/pages/aboutPage/index.ts': 'export { About } from "./ui/About"',
  '/pages/aboutPage/ui/About.tsx': 'export const About = () => null',
  '/pages/contactPage/index.ts': 'export { Contact } from "./ui/Contact"',
  '/pages/contactPage/ui/Contact.tsx': 'export const Contact = () => null',
  '/app/index.ts': `import { Home } from '@/pages/homePage'
import { About } from '@/pages/aboutPage'
const Contact = () => import('@/pages/contactPage')
export * from '@/pages/homePage'
// keep '@/pages/aboutPage' out of this
const route = '/pages/contactPage'
export { Home, About, Contact, route }
`,

  // PascalCase.
  '/widgets/HeaderBlock/index.ts': '',
  '/widgets/FooterBlock/index.ts': '',
  '/widgets/SidebarBlock/index.ts': `import '../HeaderBlock'\nimport '../FooterBlock'\n`,

  // kebab-case, snake_case and an acronym, all in one group.
  '/entities/mixed/user-card/index.ts': '',
  '/entities/mixed/post_card/index.ts': '',
  '/entities/mixed/APIClientCard/index.ts': `import '@/entities/mixed/user-card'\nimport '@/entities/mixed/post_card'\n`,

  // Repetition in the prefix only: reported, but not fixed.
  '/features/userLogin/index.ts': '',
  '/features/userLogout/index.ts': '',
  '/features/userProfile/index.ts': '',

  // Two repetitive words in one group.
  '/features/ambiguous/userLoginForm/index.ts': '',
  '/features/ambiguous/userLogoutForm/index.ts': '',
  '/features/ambiguous/userProfileForm/index.ts': '',

  // The rename target is already taken by another folder in the group.
  '/entities/taken/userCard/index.ts': '',
  '/entities/taken/postCard/index.ts': '',
  '/entities/taken/commentCard/index.ts': '',
  '/entities/taken/user/profile/index.ts': '',

  // The rename targets would collide with each other on a case-insensitive file system.
  '/entities/case/userTag/index.ts': '',
  '/entities/case/UserTag/index.ts': '',
  '/entities/case/postTag/index.ts': '',

  // The repetitive word appears twice in each name.
  '/pages/twice/homePagePage/index.ts': '',
  '/pages/twice/aboutPagePage/index.ts': '',
  '/pages/twice/contactPagePage/index.ts': '',

  // Removing the word would leave one of the slices without a name.
  '/entities/empty/userUnit/index.ts': '',
  '/entities/empty/postUnit/index.ts': '',
  '/entities/empty/unit/index.ts': '',

  // A grouped set of slices, referenced from outside the group.
  '/pages/settings/profilePane/index.ts': '',
  '/pages/settings/billingPane/index.ts': '',
  '/pages/settings/securityPane/index.ts': `import '@/pages/settings/profilePane'\nimport '@/pages/settings/billingPane'\n`,
}

vi.mock('node:fs', async (importOriginal) => {
  const originalFs = await importOriginal<typeof import('fs')>()
  const { createFsMocks } = await import('@steiger/toolkit/test')

  return createFsMocks(files, originalFs)
})

const { default: repetitiveNaming } = await import('./index.js')

/**
 * Apply the fixes of a diagnostic to a copy of the mock file system and report what it looks like after.
 *
 * This mirrors what the autofix executor does with these fixes, so the tests can check the state the
 * project ends up in rather than the shape of the fix objects.
 */
/** The mock file list is written with forward slashes, but fixes carry paths in the OS separator. */
const toOsPath = (path: string) => path.replace(/\//g, sep)

function applyFixes(fixes: Array<Fix>, before: Record<string, string> = files): Record<string, string> {
  const after: Record<string, string> = Object.fromEntries(
    Object.entries(before).map(([path, content]) => [toOsPath(path), content]),
  )

  for (const fix of fixes) {
    if (fix.type === 'edit-file') {
      const path = toOsPath(fix.path)
      after[path] = applyTextEdits(after[path], fix.edits)
    }
  }

  for (const fix of fixes) {
    if (fix.type === 'rename') {
      const from = toOsPath(fix.path)
      const to = from.slice(0, from.length - fix.path.split(/[/\\]/).at(-1)!.length) + fix.newName

      for (const path of Object.keys(after)) {
        if (path === from || path.startsWith(from + sep)) {
          after[to + path.slice(from.length)] = after[path]
          delete after[path]
        }
      }
    }
  }

  return after
}

async function diagnosticFor(root: Folder, groupPath: string): Promise<PartialDiagnostic> {
  const { diagnostics } = await repetitiveNaming.check(root)
  const diagnostic = diagnostics.find((d) => d.location.path === groupPath)
  expect(diagnostic, `expected a diagnostic at ${groupPath}`).toBeDefined()
  return diagnostic!
}

const pagesRoot = () =>
  parseIntoFsdRoot(`
    📂 pages
      📂 homePage
        📂 ui
          📄 Home.tsx
        📄 index.ts
      📂 aboutPage
        📂 ui
          📄 About.tsx
        📄 index.ts
      📂 contactPage
        📂 ui
          📄 Contact.tsx
        📄 index.ts
    📂 app
      📄 index.ts
  `)

describe('renames slices and their references', () => {
  it('drops a trailing word from camelCase slice names', async () => {
    const diagnostic = await diagnosticFor(pagesRoot(), joinFromRoot('pages'))

    const after = applyFixes(diagnostic.fixes!)

    expect(Object.keys(after)).toEqual(
      expect.arrayContaining([
        joinFromRoot('pages', 'home', 'index.ts'),
        joinFromRoot('pages', 'about', 'index.ts'),
        joinFromRoot('pages', 'contact', 'index.ts'),
      ]),
    )
    expect(after[joinFromRoot('pages', 'homePage', 'index.ts')]).toBeUndefined()
  })

  it('rewrites static, dynamic and re-exported references, and nothing else', async () => {
    const diagnostic = await diagnosticFor(pagesRoot(), joinFromRoot('pages'))

    const after = applyFixes(diagnostic.fixes!)

    expect(after[joinFromRoot('app', 'index.ts')]).toBe(`import { Home } from '@/pages/home'
import { About } from '@/pages/about'
const Contact = () => import('@/pages/contact')
export * from '@/pages/home'
// keep '@/pages/aboutPage' out of this
const route = '/pages/contactPage'
export { Home, About, Contact, route }
`)
  })

  it('collects the edits of one file into a single fix', async () => {
    const diagnostic = await diagnosticFor(pagesRoot(), joinFromRoot('pages'))

    const editFixes = diagnostic.fixes!.filter((fix) => fix.type === 'edit-file')
    expect(editFixes).toHaveLength(1)
    expect(editFixes[0]).toMatchObject({ path: joinFromRoot('app', 'index.ts') })
    expect(editFixes[0].type === 'edit-file' && editFixes[0].edits.length).toBe(4)
  })

  it('preserves PascalCase', async () => {
    const root = parseIntoFsdRoot(`
      📂 widgets
        📂 HeaderBlock
          📂 ui
          📄 index.ts
        📂 FooterBlock
          📂 ui
          📄 index.ts
        📂 SidebarBlock
          📂 ui
          📄 index.ts
    `)

    const diagnostic = await diagnosticFor(root, joinFromRoot('widgets'))
    const after = applyFixes(diagnostic.fixes!)

    expect(after[joinFromRoot('widgets', 'Header', 'index.ts')]).toBeDefined()
    expect(after[joinFromRoot('widgets', 'Footer', 'index.ts')]).toBeDefined()
    expect(after[joinFromRoot('widgets', 'Sidebar', 'index.ts')]).toBe(`import '../Header'\nimport '../Footer'\n`)
  })

  it('preserves kebab-case, snake_case and acronyms', async () => {
    const root = parseIntoFsdRoot(`
      📂 entities
        📂 mixed
          📂 user-card
            📂 ui
            📄 index.ts
          📂 post_card
            📂 ui
            📄 index.ts
          📂 APIClientCard
            📂 ui
            📄 index.ts
    `)

    const diagnostic = await diagnosticFor(root, joinFromRoot('entities', 'mixed'))
    const after = applyFixes(diagnostic.fixes!)

    expect(after[joinFromRoot('entities', 'mixed', 'user', 'index.ts')]).toBeDefined()
    expect(after[joinFromRoot('entities', 'mixed', 'post', 'index.ts')]).toBeDefined()
    expect(after[joinFromRoot('entities', 'mixed', 'APIClient', 'index.ts')]).toBe(
      `import '@/entities/mixed/user'\nimport '@/entities/mixed/post'\n`,
    )
  })

  it('keeps the group in the path of grouped slices', async () => {
    const root = parseIntoFsdRoot(`
      📂 pages
        📂 settings
          📂 profilePane
            📂 ui
            📄 index.ts
          📂 billingPane
            📂 ui
            📄 index.ts
          📂 securityPane
            📂 ui
            📄 index.ts
    `)

    const diagnostic = await diagnosticFor(root, joinFromRoot('pages', 'settings'))

    expect(diagnostic.fixes).toEqual(
      expect.arrayContaining([
        { type: 'rename', path: joinFromRoot('pages', 'settings', 'profilePane'), newName: 'profile' },
      ]),
    )

    const after = applyFixes(diagnostic.fixes!)
    expect(after[joinFromRoot('pages', 'settings', 'security', 'index.ts')]).toBe(
      `import '@/pages/settings/profile'\nimport '@/pages/settings/billing'\n`,
    )
  })
})

describe('leaves the ambiguous cases alone', () => {
  it('does not offer a fix when the repetitive word is only a prefix', async () => {
    const root = parseIntoFsdRoot(`
      📂 features
        📂 userLogin
          📂 ui
          📄 index.ts
        📂 userLogout
          📂 ui
          📄 index.ts
        📂 userProfile
          📂 ui
          📄 index.ts
    `)

    const diagnostic = await diagnosticFor(root, joinFromRoot('features'))
    expect(diagnostic.message).toBe('Repetitive word "user" in slice names.')
    expect(diagnostic.fixes).toBeUndefined()
  })

  it('does not offer a fix when a group has several repetitive words', async () => {
    const root = parseIntoFsdRoot(`
      📂 features
        📂 ambiguous
          📂 userLoginForm
            📂 ui
            📄 index.ts
          📂 userLogoutForm
            📂 ui
            📄 index.ts
          📂 userProfileForm
            📂 ui
            📄 index.ts
    `)

    const { diagnostics } = await repetitiveNaming.check(root)
    expect(diagnostics.map((d) => d.message).sort()).toEqual([
      'Repetitive word "form" in slice names.',
      'Repetitive word "user" in slice names.',
    ])
    expect(diagnostics.every((d) => d.fixes === undefined)).toBe(true)
  })

  it('does not offer a fix when the new name is already taken', async () => {
    const root = parseIntoFsdRoot(`
      📂 entities
        📂 taken
          📂 userCard
            📂 ui
            📄 index.ts
          📂 postCard
            📂 ui
            📄 index.ts
          📂 commentCard
            📂 ui
            📄 index.ts
          📂 user
            📂 profile
              📂 ui
              📄 index.ts
    `)

    const diagnostic = await diagnosticFor(root, joinFromRoot('entities', 'taken'))
    expect(diagnostic.fixes).toBeUndefined()
  })

  it('does not offer a fix when the new names would collide on a case-insensitive file system', async () => {
    const root = parseIntoFsdRoot(`
      📂 entities
        📂 case
          📂 userTag
            📂 ui
            📄 index.ts
          📂 UserTag
            📂 ui
            📄 index.ts
          📂 postTag
            📂 ui
            📄 index.ts
    `)

    const diagnostic = await diagnosticFor(root, joinFromRoot('entities', 'case'))
    expect(diagnostic.fixes).toBeUndefined()
  })

  it('does not offer a fix when the word appears more than once in a name', async () => {
    // Cutting one "page" out of homePagePage leaves homePage, which gets reported for the
    // same word all over again. A fix has to resolve the report it belongs to.
    const root = parseIntoFsdRoot(`
      📂 pages
        📂 twice
          📂 homePagePage
            📂 ui
            📄 index.ts
          📂 aboutPagePage
            📂 ui
            📄 index.ts
          📂 contactPagePage
            📂 ui
            📄 index.ts
    `)

    const diagnostic = await diagnosticFor(root, joinFromRoot('pages', 'twice'))
    expect(diagnostic.message).toBe('Repetitive word "page" in slice names.')
    expect(diagnostic.fixes).toBeUndefined()
  })

  it('does not offer a fix when a slice would be left without a name', async () => {
    const root = parseIntoFsdRoot(`
      📂 entities
        📂 empty
          📂 userUnit
            📂 ui
            📄 index.ts
          📂 postUnit
            📂 ui
            📄 index.ts
          📂 unit
            📂 ui
            📄 index.ts
    `)

    const diagnostic = await diagnosticFor(root, joinFromRoot('entities', 'empty'))
    expect(diagnostic.fixes).toBeUndefined()
  })
})
