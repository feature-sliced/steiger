import { readFileSync } from 'fs'
import { join } from 'path'
import { TSConfckParseError } from 'tsconfck'
import { Folder } from '@steiger/types'

interface ErrorContext {
  vfs: Folder
}

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const readPackageJSON = (path: string) => JSON.parse(readFileSync(join(path, 'package.json'), 'utf-8')) as PackageJson

async function checkNuxtConfigError(error: unknown, { vfs }: ErrorContext) {
  if (!(error instanceof TSConfckParseError)) return false
  if (error.code !== 'EXTENDS_RESOLVE') return false
  if (!error.cause?.message?.includes('.nuxt/tsconfig')) return false

  try {
    const projectRootPath = vfs.path
    const packageJson = readPackageJSON(projectRootPath)
    const hasNuxt = !!(packageJson.dependencies?.nuxt || packageJson.devDependencies?.nuxt)
    if (!hasNuxt) return false

    console.error('\n\x1b[31mError: Unable to find Nuxt TypeScript configuration\x1b[0m')
    console.error('\nThis appears to be a Nuxt project, but the TypeScript configuration files are missing.')
    console.error('These files are auto-generated when you install dependencies.')
    console.error('\nTo fix this:')
    console.error('1. Run \x1b[36mnpm install\x1b[0m or \x1b[36myarn\x1b[0m or \x1b[36mpnpm install\x1b[0m')
    console.error('2. Then run Steiger again\n')
    return true
  } catch {
    return false
  }
}

export function handleError(error: unknown, context: ErrorContext): never {
  const isHandled = [checkNuxtConfigError].some((checker) => checker(error, context))

  if (isHandled) {
    process.exit(1)
  }

  throw error
}
