#!/usr/bin/env node

import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'
import {
  createConnection,
  InitializeResult,
  TextDocumentSyncKind,
  DiagnosticSeverity,
  WorkspaceDocumentDiagnosticReport,
  Diagnostic,
} from 'vscode-languageserver/node'
import { cosmiconfig } from 'cosmiconfig'
import fsd from '@feature-sliced/steiger-plugin'
import type { Diagnostic as SteigerDiagnostic } from '@steiger/types'

import { processConfiguration } from './models/config'
import { linter } from './app'
import packageJson from '../package.json'

const connection = createConnection(process.stdin, process.stdout)

type Watcher = Awaited<ReturnType<typeof linter.watch>>

const workspaces = new Map<string, { sourcePath: string; watcher: Watcher; diagnostics: SteigerDiagnostic[] }>()
async function addWorkspace(rootPath: string) {
  const { config, filepath } = (await cosmiconfig('steiger').search(rootPath)) ?? {
    config: null,
    filepath: undefined,
  }
  const configLocationDirectory = filepath ? dirname(filepath) : null
  processConfiguration(config ?? fsd.configs.recommended, configLocationDirectory)

  if (rootPath !== undefined) {
    const sourcePath = join(rootPath, 'src')
    const watcher = await linter.watch(sourcePath, {
      debounceInterval: 100,
      pollInterval: 50,
      stabilityThreshold: 100,
    })

    const diagnostics: SteigerDiagnostic[] = []
    workspaces.set(rootPath, { sourcePath, watcher, diagnostics })

    watcher[0].watch((state) => {
      diagnostics.splice(0, Infinity, ...state)

      connection.languages.diagnostics.refresh()
    })
  }
}
async function removeWorkspace(rootPath: string) {
  const workspace = workspaces.get(rootPath)
  if (workspace) {
    workspace.watcher[1]()
    workspaces.delete(rootPath)
  }
}
function removeAllWorkspaces() {
  for (const [rootPath] of workspaces) {
    removeWorkspace(rootPath)
  }
}

connection.onInitialize(async (params): Promise<InitializeResult> => {
  for (const workspace of params.workspaceFolders ?? []) {
    await addWorkspace(fileURLToPath(workspace.uri))
  }

  return {
    serverInfo: { name: 'steiger', version: packageJson.version },
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

connection.workspace.onDidChangeWorkspaceFolders(async (event) => {
  for (const workspace of event.added) {
    await addWorkspace(fileURLToPath(workspace.uri))
  }

  for (const workspace of event.removed) {
    removeWorkspace(fileURLToPath(workspace.uri))
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
