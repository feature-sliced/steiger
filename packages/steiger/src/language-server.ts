#!/usr/bin/env node

import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'
import {
  createConnection,
  TextDocuments,
  InitializeResult,
  TextDocumentSyncKind,
  DiagnosticSeverity,
  WorkspaceDocumentDiagnosticReport,
  Diagnostic,
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { cosmiconfig } from 'cosmiconfig'
import fsd from '@feature-sliced/steiger-plugin'

import { processConfiguration } from './models/config'
import { linter } from './app'

const connection = createConnection(process.stdin, process.stdout)

const documents = new TextDocuments(TextDocument)

let rootUri: string

let steigerDiagnostic: SteigerDiagnostic[] = []

connection.onInitialize(async (params): Promise<InitializeResult> => {
  rootUri = params.workspaceFolders?.[0]?.uri ?? ''

  const searchPath = rootUri ? fileURLToPath(rootUri) : undefined
  const { config, filepath } = (await cosmiconfig('steiger').search(searchPath)) ?? {
    config: null,
    filepath: undefined,
  }
  const configLocationDirectory = filepath ? dirname(filepath) : null
  processConfiguration(config ?? fsd.configs.recommended, configLocationDirectory)

  const targetPath = join(fileURLToPath(rootUri), 'src')
  const [diagnosticsChanged] = await linter.watch(targetPath, {
    debounceInterval: 100,
    pollInterval: 50,
    stabilityThreshold: 100,
  })
  diagnosticsChanged.watch((state) => {
    steigerDiagnostic = state

    connection.languages.diagnostics.refresh()
  })

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      diagnosticProvider: {
        interFileDependencies: true,
        workspaceDiagnostics: true,
      },
    },
  }
})

type SteigerDiagnostic = Awaited<ReturnType<(typeof linter)['run']>>[number]

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

connection.languages.diagnostics.on((params) => {
  const path = fileURLToPath(params.textDocument.uri)

  const items: Diagnostic[] = []

  for (const d of steigerDiagnostic) {
    if (path.endsWith(d.location.path)) {
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
    const group = byPath.get(d.location.path) ?? []
    group.push(d)
    byPath.set(d.location.path, group)
  }

  const items: WorkspaceDocumentDiagnosticReport[] = []
  for (const [path, diagnostics] of byPath) {
    const stats = statSync(path, { throwIfNoEntry: false })
    if (stats?.isFile()) {
      items.push({
        kind: 'full' as const,
        uri: pathToFileURL(path).toString(),
        version: null,
        items: diagnostics.map(toLspDiagnostic),
      })
    } else if (stats?.isDirectory()) {
      const indexPath = getRelevantPublicApiPath(path)
      if (!indexPath) {
        continue
      }

      items.push({
        kind: 'full' as const,
        uri: pathToFileURL(indexPath).toString(),
        version: null,
        items: diagnostics.map(toLspDiagnostic),
      })
    }
  }

  return { items }
})

documents.listen(connection)
connection.listen()
