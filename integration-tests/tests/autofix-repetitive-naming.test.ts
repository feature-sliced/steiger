import * as fs from 'node:fs/promises'
import os from 'node:os'
import { join } from 'node:path'
import { exec } from 'tinyexec'

import { beforeAll, expect, test } from 'vitest'

import { getSteigerBinPath } from '../utils/get-bin-path.js'

const temporaryDirectory = await fs.realpath(os.tmpdir())
const steiger = await getSteigerBinPath()

const project = join(temporaryDirectory, 'steiger-autofix-repetitive-naming')

/** A project whose pages all end in "Page" and whose app layer refers to them in every supported way. */
const projectFiles: Record<string, string> = {
  'tsconfig.json': JSON.stringify(
    {
      compilerOptions: {
        module: 'ESNext',
        jsx: 'react-jsx',
        moduleResolution: 'Bundler',
        baseUrl: '.',
        paths: { '@/*': ['src/*'] },
      },
      include: ['src'],
    },
    null,
    2,
  ),
  'src/shared/ui/index.ts': 'export const Layout = () => null\n',
  'src/pages/homePage/ui/Home.tsx': `import { Layout } from '@/shared/ui'\nexport const Home = () => Layout\n`,
  'src/pages/homePage/index.ts': `export { Home } from './ui/Home'\n`,
  'src/pages/aboutPage/ui/About.tsx': `export const About = () => null\n`,
  'src/pages/aboutPage/index.ts': `export { About } from './ui/About'\n`,
  'src/pages/contactPage/ui/Contact.tsx': `export const Contact = () => null\n`,
  'src/pages/contactPage/index.ts': `export { Contact } from './ui/Contact'\n`,
  'src/app/ui/routes.ts': `import { Home } from '@/pages/homePage'
import { About } from '@/pages/aboutPage'

export * from '@/pages/homePage'
export { Contact } from '@/pages/contactPage'

export const lazyContact = () => import('@/pages/contactPage')

// The comment mentioning '@/pages/homePage' must survive untouched.
export const routes = { home: '/pages/homePage', Home, About }
`,
  'src/app/index.ts': `export * from './ui/routes'\n`,
}

async function writeProject() {
  await fs.rm(project, { recursive: true, force: true })

  for (const [path, content] of Object.entries(projectFiles)) {
    const absolutePath = join(project, path)
    await fs.mkdir(join(absolutePath, '..'), { recursive: true })
    await fs.writeFile(absolutePath, content)
  }
}

function runSteiger(...args: Array<string>) {
  return exec('node', [steiger, 'src', ...args], {
    nodeOptions: { cwd: project, env: { NO_COLOR: '1' } },
  })
}

/** The report Steiger gives before anything is fixed. */
let reportBeforeFix: string

// Running the CLI is by far the slowest part of these tests, so the project is set up and fixed once
// and the tests below only make assertions about the result. That also keeps them independent: a
// failing assertion in one of them no longer starves the others of the work they were relying on.
beforeAll(async () => {
  await writeProject()
  reportBeforeFix = (await runSteiger()).stderr
  await runSteiger('--fix')
})

test('reports the repetitive word as auto-fixable before fixing', () => {
  expect(reportBeforeFix).toContain('Repetitive word "page" in slice names.')
  expect(reportBeforeFix).toContain('Auto-fixable')
})

test('renames the slices', async () => {
  expect(await fs.readdir(join(project, 'src/pages'))).toEqual(['about', 'contact', 'home'])
})

test('keeps the relative imports inside the renamed slices', async () => {
  expect(await fs.readFile(join(project, 'src/pages/home/index.ts'), 'utf8')).toBe(`export { Home } from './ui/Home'\n`)
})

test('rewrites static, dynamic and re-exported references, and nothing else', async () => {
  expect(await fs.readFile(join(project, 'src/app/ui/routes.ts'), 'utf8')).toBe(`import { Home } from '@/pages/home'
import { About } from '@/pages/about'

export * from '@/pages/home'
export { Contact } from '@/pages/contact'

export const lazyContact = () => import('@/pages/contact')

// The comment mentioning '@/pages/homePage' must survive untouched.
export const routes = { home: '/pages/homePage', Home, About }
`)
})

test('leaves no repetitive-naming diagnostic behind, and a second fix changes nothing', async () => {
  const { stderr } = await runSteiger()
  expect(stderr).not.toContain('Repetitive word')

  const snapshot = await readProject()
  await runSteiger('--fix')
  expect(await readProject()).toEqual(snapshot)
})

async function readProject(): Promise<Record<string, string>> {
  const contents: Record<string, string> = {}

  async function walk(relativePath: string) {
    const entries = await fs.readdir(join(project, relativePath), { withFileTypes: true })

    for (const entry of entries) {
      const entryPath = join(relativePath, entry.name)
      if (entry.isDirectory()) {
        await walk(entryPath)
      } else {
        contents[entryPath] = await fs.readFile(join(project, entryPath), 'utf8')
      }
    }
  }

  await walk('src')

  return contents
}
