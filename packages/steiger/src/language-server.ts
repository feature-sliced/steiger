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

const connection = createConnection(process.stdin, process.stdout)

let steigerDiagnostic: SteigerDiagnostic[] = []

let disposeWatcher: (() => void) | undefined
function stopWatcher() {
  disposeWatcher?.()
  disposeWatcher = undefined
}

connection.onInitialize(async (params): Promise<InitializeResult> => {
  const rootUri = params.workspaceFolders?.[0]?.uri ?? ''

  const rootPath = rootUri ? fileURLToPath(rootUri) : undefined
  const { config, filepath } = (await cosmiconfig('steiger').search(rootPath)) ?? {
    config: null,
    filepath: undefined,
  }
  const configLocationDirectory = filepath ? dirname(filepath) : null
  processConfiguration(config ?? fsd.configs.recommended, configLocationDirectory)

  if (rootPath !== undefined) {
    // Tear down any watcher from a previous initialization before starting a new one.
    stopWatcher()

    const targetPath = join(rootPath, 'src')
    const [diagnosticsChanged, dispose] = await linter.watch(targetPath, {
      debounceInterval: 100,
      pollInterval: 50,
      stabilityThreshold: 100,
    })
    disposeWatcher = dispose

    diagnosticsChanged.watch((state) => {
      steigerDiagnostic = state

      connection.languages.diagnostics.refresh()
    })
  }

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.None,
      diagnosticProvider: {
        interFileDependencies: true,
        workspaceDiagnostics: true,
      },
    },
  }
})

function toLspDiagnostic(d: SteigerDiagnostic): Diagnostic {
  return {
    message: d.message,
    severity: d.severity === 'error' ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
    code: d.ruleName,
    codeDescription: { href: d.getRuleDescriptionUrl(d.ruleName).toString() },
    range: {
      start: { line: (d.location.line ?? 1) - 1, character: (d.location.column ?? 1) - 1 },
      end: {
        line: (d.location.end?.line ?? d.location.line ?? 1) - 1,
        character: (d.location.end?.column ?? d.location.column ?? 1) - 1,
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

connection.languages.diagnostics.on((params) => {
  const path = fileURLToPath(params.textDocument.uri)

  const items: Diagnostic[] = []

  for (const d of steigerDiagnostic) {
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
  for (const d of steigerDiagnostic) {
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

connection.onShutdown(stopWatcher)
connection.onExit(stopWatcher)

connection.listen()
