#!/usr/bin/env node

import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, sep } from 'node:path'
import { statSync } from 'node:fs'
import {
  createConnection,
  InitializeResult,
  TextDocumentSyncKind,
  DiagnosticSeverity,
  WorkspaceDocumentDiagnosticReport,
  type WorkspaceFoldersChangeEvent,
  Diagnostic,
} from 'vscode-languageserver/node'
import { cosmiconfig } from 'cosmiconfig'
import type { Diagnostic as SteigerDiagnostic } from '@steiger/types'
import type * as Steiger from 'steiger'

import { findSteigerModule } from './find-steiger'
import { findProjectRoots } from './find-project-root'
import { findSourceDirectory } from './find-source-directory'

let steigerModule:
  | { linter: typeof Steiger.linter; processScopedConfiguration: typeof Steiger.processScopedConfiguration }
  | undefined = undefined

const connection = createConnection(process.stdin, process.stdout)

const workspaces = new Map<string, { dispose: () => void | Promise<void>; diagnostics: SteigerDiagnostic[] }>()

async function addWorkspace(rootPath: string) {
  await removeWorkspace(rootPath)

  const projectRoots = await findProjectRoots(rootPath)
  for (const projectRoot of projectRoots) {
    const { config, filepath } = (await cosmiconfig('steiger').search(projectRoot)) ?? {
      config: null,
      filepath: undefined,
    }
    const configLocationDirectory = filepath ? dirname(filepath) : null
    const processedConfig = steigerModule!.processScopedConfiguration(config, configLocationDirectory)

    const sourcePath = await findSourceDirectory(projectRoot)
    if (!sourcePath) continue

    const [diagnosticsChanged, dispose] = await steigerModule!.linter.watch(sourcePath, {
      debounceInterval: 100,
      pollInterval: 50,
      stabilityThreshold: 100,
      config: processedConfig,
    })

    const diagnostics: SteigerDiagnostic[] = []
    workspaces.set(rootPath, { dispose, diagnostics })

    diagnosticsChanged.watch((state) => {
      diagnostics.splice(0, Infinity, ...state)

      connection.languages.diagnostics.refresh()
    })
  }
}

async function removeWorkspace(rootPath: string) {
  for (const [path, workspace] of workspaces) {
    if (path === rootPath || path.startsWith(`${rootPath}${sep}`)) {
      await workspace.dispose()
      workspaces.delete(path)
    }
  }
}

async function removeAllWorkspaces() {
  for (const [, workspace] of workspaces) {
    await workspace.dispose()
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
    connection.languages.diagnostics.refresh()
  }
}

let clientHandlesWorkspaceFolders = false

connection.onInitialize(async (params): Promise<InitializeResult> => {
  for (const workspace of params.workspaceFolders ?? []) {
    if (steigerModule) {
      break
    }

    const result = await findSteigerModule(fileURLToPath(workspace.uri))
    if (result.path) {
      steigerModule = await import(result.path)
    }
  }
  // TODO: report error about missing steiger module

  for (const workspace of params.workspaceFolders ?? []) {
    try {
      await addWorkspace(fileURLToPath(workspace.uri))
    } catch (error) {
      connection.console.error(`steiger: failed to start linting ${workspace.uri}: ${String(error)}`)
    }
  }

  if (params.capabilities.workspace?.workspaceFolders === true) {
    clientHandlesWorkspaceFolders = true
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
      diagnosticProvider: {
        interFileDependencies: true,
        workspaceDiagnostics: true,
      },
    },
  }
})

connection.onInitialized(() => {
  if (clientHandlesWorkspaceFolders) {
    connection.workspace.onDidChangeWorkspaceFolders(handleWorkspaceFoldersChange)
  }
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
    items,
  }
})

connection.languages.diagnostics.onWorkspace(() => {
  const byPath = new Map<string, SteigerDiagnostic[]>()
  for (const d of getAllDiagnostics()) {
    const documentPath = resolveDiagnosticDocumentPath(d.location.path)
    if (documentPath === undefined) continue

    const group = byPath.get(documentPath) ?? []
    group.push(d)
    byPath.set(documentPath, group)
  }

  const items: WorkspaceDocumentDiagnosticReport[] = []
  for (const [path, diagnostics] of byPath) {
    items.push({
      kind: 'full' as const,
      uri: pathToFileURL(path).toString(),
      version: null,
      items: diagnostics.map(toLspDiagnostic),
    })
  }

  return { items }
})

connection.onShutdown(removeAllWorkspaces)
connection.onExit(removeAllWorkspaces)

connection.listen()
