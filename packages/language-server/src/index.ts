import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, sep } from 'node:path'
import { statSync } from 'node:fs'
import { createRequire } from 'node:module'
import {
  createConnection,
  InitializeResult,
  TextDocumentSyncKind,
  DiagnosticSeverity,
  WorkspaceDocumentDiagnosticReport,
  type WorkspaceFoldersChangeEvent,
  Diagnostic,
  DidChangeWatchedFilesNotification,
} from 'vscode-languageserver/node'
import { cosmiconfig } from 'cosmiconfig'
import type { Diagnostic as SteigerDiagnostic } from '@steiger/types'
import type * as Steiger from 'steiger'

import { findSteigerModule } from './find-steiger'
import { configFilePatterns, findProjectRoots } from './find-project-root'
import { findSourceDirectory } from './find-source-directory'
import { semverToNumber } from './semver'

let steigerModule:
  | { linter: typeof Steiger.linter; processScopedConfiguration: typeof Steiger.processScopedConfiguration }
  | undefined = undefined

const connection = createConnection(process.stdin, process.stdout)

const workspaces = new Map<string, { dispose: () => void | Promise<void>; diagnostics: SteigerDiagnostic[] }>()

/**
 * Incremental counter used as `resultId`, to make client send `previousResultIds` back to the server
 */
let diagnosticsVersion = 0

function formatCosmiconfigError(error: unknown): string {
  if (!(error instanceof Error)) return String(error)

  // `filepath` is a special property on some cosmiconfig errors
  let filepath = ''
  if ('filepath' in error && typeof error.filepath === 'string') filepath = error.filepath

  let reason = ''
  if ('reason' in error && typeof error.reason === 'string') reason = error.reason

  if (filepath !== '' && reason !== '') return `${error.name} while loading config at "${filepath}": ${reason}`
  if (filepath !== '') return `${error.name} while loading config at "${filepath}": ${error.message}`
  return `${error.name}: ${error.message}`
}

const freshLoadEsm = async (filepath: string) => {
  const mtime = statSync(filepath).mtimeMs
  return (await import(`${pathToFileURL(filepath).href}?v=${mtime}`)).default
}

const freshLoadCjs = (filepath: string) => {
  const require = createRequire(filepath)
  delete require.cache[require.resolve(filepath)]
  const mod = require(filepath)
  return mod?.default ?? mod
}

// cosmiconfig hits node import cache, so we need a way to import/require latest version of the config file
const configLoaders = {
  '.js': freshLoadEsm,
  '.mjs': freshLoadEsm,
  '.ts': freshLoadEsm,
  '.mts': freshLoadEsm,
  '.cjs': freshLoadCjs,
  '.cts': freshLoadCjs,
}

async function addWorkspace(rootPath: string) {
  await removeWorkspace(rootPath)
  if (!steigerModule) return

  const projectRoots = await findProjectRoots(rootPath)
  connection.console.log(`steiger: found ${projectRoots.length} project root(s) in "${rootPath}"`)
  for (const projectRoot of projectRoots) {
    let config: Parameters<typeof Steiger.processScopedConfiguration>[0]
    let filepath: string | undefined = undefined
    try {
      const result = await cosmiconfig('steiger', { loaders: configLoaders }).search(projectRoot)
      if (result == null) {
        connection.console.log(`steiger: "${projectRoot}": skipped (no configuration found)`)
        continue
      }

      if (result.isEmpty) {
        connection.console.warn(`steiger: "${projectRoot}": skipped (configuration file "${result.filepath}" is empty)`)
        continue
      }

      config = result.config
      filepath = result.filepath
    } catch (error) {
      const message = formatCosmiconfigError(error).replaceAll('\n', ' ')

      connection.window.showErrorMessage(`steiger: ${message}`)

      connection.console.error(`steiger: "${projectRoot}": failed to load configuration: ${message}`)
      if (error instanceof Error && error.stack) connection.console.error(error.stack)
      continue
    }

    const configLocationDirectory = filepath ? dirname(filepath) : null
    let processedConfig: ReturnType<typeof steigerModule.processScopedConfiguration>
    try {
      processedConfig = steigerModule.processScopedConfiguration(config, configLocationDirectory)
    } catch (error) {
      connection.console.error(
        `steiger: "${projectRoot}": failed to process configuration: ${error instanceof Error ? error.message : String(error)}`,
      )
      if (error instanceof Error && error.stack) connection.console.error(error.stack)
      continue
    }

    const sourcePath = await findSourceDirectory(projectRoot)
    if (!sourcePath) {
      connection.console.log(`steiger: "${projectRoot}": skipped (no source directory found)`)
      continue
    }

    const [diagnosticsChanged, dispose] = await steigerModule.linter.watch(sourcePath, {
      debounceInterval: 100,
      pollInterval: 50,
      stabilityThreshold: 100,
      config: processedConfig,
    })

    const diagnostics: SteigerDiagnostic[] = []
    workspaces.set(projectRoot, { dispose, diagnostics })
    connection.console.log(`steiger: "${projectRoot}": started linting "${sourcePath}" (config: "${filepath}")`)

    diagnosticsChanged.watch((state) => {
      diagnostics.splice(0, Infinity, ...state)
      diagnosticsVersion += 1

      refreshDiagnostics()
    })
  }
}

async function removeWorkspace(rootPath: string) {
  for (const [path, workspace] of workspaces) {
    if (path === rootPath || path.startsWith(`${rootPath}${sep}`)) {
      await workspace.dispose()
      workspaces.delete(path)
      diagnosticsVersion += 1
      connection.console.log(`steiger: "${path}": stopped linting`)
    }
  }
}

async function removeAllWorkspaces() {
  for (const [path, workspace] of workspaces) {
    await workspace.dispose()
    diagnosticsVersion += 1
    connection.console.log(`steiger: "${path}": stopped linting`)
  }

  workspaces.clear()
}

async function handleWorkspaceFoldersChange(event: WorkspaceFoldersChangeEvent) {
  for (const workspace of event.removed) {
    try {
      await removeWorkspace(fileURLToPath(workspace.uri))
    } catch (error) {
      connection.console.error(`steiger: failed to stop linting ${workspace.uri}: ${String(error)}`)
    }
  }

  for (const workspace of event.added) {
    try {
      await addWorkspace(fileURLToPath(workspace.uri))
    } catch (error) {
      connection.console.error(`steiger: failed to start linting ${workspace.uri}: ${String(error)}`)
    }
  }

  if (event.removed.length > 0) {
    refreshDiagnostics()
  }
}

let clientHandlesWorkspaceFolders = false
let clientHandlesWatchedFiles = false
let clientSupportsPullDiagnostics = false

const STEIGER_MIN_VERSION = '0.8.0'
const STEIGER_MIN_VERSION_NUMBER = semverToNumber(STEIGER_MIN_VERSION)
if (STEIGER_MIN_VERSION_NUMBER === undefined) {
  throw new Error(`STEIGER_MIN_VERSION "${STEIGER_MIN_VERSION}" is invalid`)
}

connection.onInitialize(async (params): Promise<InitializeResult> => {
  clientHandlesWorkspaceFolders = params.capabilities.workspace?.workspaceFolders === true
  clientHandlesWatchedFiles = params.capabilities.workspace?.didChangeWatchedFiles?.dynamicRegistration === true
  clientSupportsPullDiagnostics =
    params.capabilities.textDocument?.diagnostic !== undefined &&
    params.capabilities.workspace?.diagnostics?.refreshSupport === true

  let error = ''
  for (const workspace of params.workspaceFolders ?? []) {
    if (steigerModule) {
      break
    }

    try {
      const result = await findSteigerModule(fileURLToPath(workspace.uri))
      const version = semverToNumber(result.version)
      if (version !== undefined && version < STEIGER_MIN_VERSION_NUMBER) {
        error = `found steiger module but version is too old: ${result.version}, minimum version is ${STEIGER_MIN_VERSION}`
        continue
      }

      if (result.path) {
        steigerModule = await import(pathToFileURL(result.path).href)
      }
    } catch (error) {
      connection.console.error(`steiger: failed to find steiger module: ${String(error)}`)
    }
  }
  if (!steigerModule && error !== '') {
    connection.console.error(`steiger: ${error}`)
    connection.window.showErrorMessage(`steiger: ${error}`)
  }

  for (const workspace of params.workspaceFolders ?? []) {
    try {
      await addWorkspace(fileURLToPath(workspace.uri))
    } catch (error) {
      connection.console.error(`steiger: failed to start linting ${workspace.uri}: ${String(error)}`)
    }
  }

  return {
    serverInfo: { name: 'steiger' },
    capabilities: {
      workspace: {
        workspaceFolders: {
          supported: true,
          changeNotifications: true,
        },
      },
      textDocumentSync: TextDocumentSyncKind.None,
      ...(clientSupportsPullDiagnostics
        ? { diagnosticProvider: { interFileDependencies: true, workspaceDiagnostics: true } }
        : {}),
    },
  }
})

connection.onInitialized(() => {
  if (clientHandlesWorkspaceFolders) {
    connection.workspace.onDidChangeWorkspaceFolders(handleWorkspaceFoldersChange)
  }

  if (clientHandlesWatchedFiles) {
    connection.client.register(DidChangeWatchedFilesNotification.type, {
      watchers: configFilePatterns.map((pattern) => ({ globPattern: pattern })),
    })
  }
})

connection.onDidChangeWatchedFiles(async (params) => {
  for (const change of params.changes) {
    const projectRoot = dirname(fileURLToPath(change.uri))
    await addWorkspace(projectRoot)
  }

  refreshDiagnostics()
})

function toLspDiagnostic(d: SteigerDiagnostic): Diagnostic {
  return {
    message: d.message,
    severity: d.severity === 'error' ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
    code: d.ruleName,
    codeDescription: { href: d.getRuleDescriptionUrl(d.ruleName).toString() },
    range: {
      start: { line: (d.location.start?.line ?? 1) - 1, character: (d.location.start?.column ?? 1) - 1 },
      end: {
        line: (d.location.end?.line ?? d.location.start?.line ?? 1) - 1,
        character: (d.location.end?.column ?? d.location.start?.column ?? 1) - 1,
      },
    },
  }
}

function fileExists(path: string): boolean {
  return statSync(path, { throwIfNoEntry: false })?.isFile() ?? false
}

function getRelevantPublicApiPath(path: string): string | undefined {
  let result = join(path, 'index.ts')
  if (fileExists(result)) {
    return result
  }

  result = join(path, 'index.mts')
  if (fileExists(result)) {
    return result
  }

  result = join(path, 'index.cts')
  if (fileExists(result)) {
    return result
  }

  result = join(path, 'index.js')
  if (fileExists(result)) {
    return result
  }

  result = join(path, 'index.mjs')
  if (fileExists(result)) {
    return result
  }

  result = join(path, 'index.cjs')
  if (fileExists(result)) {
    return result
  }

  result = join(path, 'index.tsx')
  if (fileExists(result)) {
    return result
  }

  result = join(path, 'index.jsx')
  if (fileExists(result)) {
    return result
  }

  return undefined
}

function resolveDiagnosticDocumentPath(locationPath: string): string | undefined {
  const stats = statSync(locationPath, { throwIfNoEntry: false })
  if (stats?.isFile()) return locationPath
  if (stats?.isDirectory()) return getRelevantPublicApiPath(locationPath)
  return undefined
}

function getAllDiagnostics(): SteigerDiagnostic[] {
  const diagnostics: SteigerDiagnostic[] = []
  for (const { diagnostics: workspaceDiagnostics } of workspaces.values()) {
    diagnostics.push(...workspaceDiagnostics)
  }
  return diagnostics
}

const lastPublishedUris = new Set<string>()

function refreshDiagnostics() {
  if (clientSupportsPullDiagnostics) {
    connection.languages.diagnostics.refresh()
    return
  }

  const diagnosticsByUri = new Map<string, Diagnostic[]>()
  for (const d of getAllDiagnostics()) {
    const documentPath = resolveDiagnosticDocumentPath(d.location.path)
    if (documentPath === undefined) continue

    const uri = pathToFileURL(documentPath).toString()
    const group = diagnosticsByUri.get(uri) ?? []
    group.push(toLspDiagnostic(d))
    diagnosticsByUri.set(uri, group)
  }

  for (const uri of lastPublishedUris) {
    if (!diagnosticsByUri.has(uri)) {
      connection.sendDiagnostics({ uri, diagnostics: [] })
    }
  }
  lastPublishedUris.clear()

  for (const [uri, diagnostics] of diagnosticsByUri) {
    connection.sendDiagnostics({ uri, diagnostics })
    lastPublishedUris.add(uri)
  }
}

connection.languages.diagnostics.on((params) => {
  const path = fileURLToPath(params.textDocument.uri)

  const items: Diagnostic[] = []

  for (const d of getAllDiagnostics()) {
    if (resolveDiagnosticDocumentPath(d.location.path) === path) {
      items.push(toLspDiagnostic(d))
    }
  }

  return {
    kind: 'full',
    // must be sent to the client so we can clear this later
    resultId: String(diagnosticsVersion),
    items,
  }
})

connection.languages.diagnostics.onWorkspace((params) => {
  const byPath = new Map<string, SteigerDiagnostic[]>()
  for (const d of getAllDiagnostics()) {
    const documentPath = resolveDiagnosticDocumentPath(d.location.path)
    if (documentPath === undefined) continue

    const group = byPath.get(documentPath) ?? []
    group.push(d)
    byPath.set(documentPath, group)
  }

  const items: WorkspaceDocumentDiagnosticReport[] = []
  const reportedUris = new Set<string>()

  for (const [path, diagnostics] of byPath) {
    const uri = pathToFileURL(path).toString()
    reportedUris.add(uri)
    items.push({
      kind: 'full' as const,
      uri,
      version: null,
      // must be sent to the client so we can clear this later
      resultId: String(diagnosticsVersion),
      items: diagnostics.map(toLspDiagnostic),
    })
  }

  // steiger sends all diagnostics at once, this makes sure any previous diagnostics are cleared
  for (const { uri } of params.previousResultIds ?? []) {
    if (!reportedUris.has(uri)) {
      items.push({ kind: 'full' as const, uri, version: null, items: [] })
    }
  }

  return { items }
})

connection.onShutdown(removeAllWorkspaces)
connection.onExit(removeAllWorkspaces)

export default connection
