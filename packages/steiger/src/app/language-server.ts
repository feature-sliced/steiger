import {
  createConnection,
  ProposedFeatures,
  TextDocumentSyncKind,
  DiagnosticSeverity,
  Position,
} from 'vscode-languageserver/node'
import { URI } from 'vscode-uri'

import { linter } from '../app'
import packageJson from '../../package.json'
import type { Diagnostic } from '@steiger/types'

// Creates the LSP connection
const connection = createConnection(ProposedFeatures.all)

connection.onInitialize((params) => {
  const workspaceFolders = params.workspaceFolders ?? []
  for (const workspaceFolder of workspaceFolders) {
    const uriSegments = URI.parse(workspaceFolder.uri)

    if (uriSegments.scheme !== 'file') {
      console.log('idk what to do with', workspaceFolder.uri.toString())
      continue
    }

    const pathToFolder = uriSegments.path
    console.log('running linter on', pathToFolder)
    linter.run(pathToFolder).then((diagnostics) => {
      const filesWithErrors = diagnostics.reduce<Map<string, Array<Diagnostic>>>((fileMap, diagnostic) => {
        const diagnosticsHere = fileMap.get(diagnostic.location.path)
        fileMap.set(diagnostic.location.path, (diagnosticsHere ?? []).concat(diagnostic))
        return fileMap
      }, new Map())

      for (const [file, errors] of filesWithErrors.entries()) {
        connection.sendDiagnostics({
          uri: URI.file(file).toString(),
          diagnostics: errors.map((steigerDiagnostic) => ({
            severity: steigerDiagnostic.severity === 'error' ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
            message: steigerDiagnostic.message,
            source: packageJson.name,
            code: steigerDiagnostic.ruleName,
            // codeDescription: steigerDiagnostic.getRuleDescriptionUrl
            //   ? {
            //     href: steigerDiagnostic.getRuleDescriptionUrl(steigerDiagnostic.ruleName),
            //   }
            //   : {},
            range: {
              start: steigerDiagnostic.location.line
                ? Position.create(steigerDiagnostic.location.line, steigerDiagnostic.location.column ?? 0)
                : Position.create(0, 0),
              end: steigerDiagnostic.location.line
                ? Position.create(steigerDiagnostic.location.line, steigerDiagnostic.location.column ?? 0)
                : Position.create(0, 0),
            },
          })),
        })
      }
    })
  }

  return {
    serverInfo: {
      name: packageJson.name,
      version: packageJson.version,
    },
    capabilities: {
      textDocumentSync: {
        change: TextDocumentSyncKind.Incremental,
      },
    },
  }
})

connection.listen()
