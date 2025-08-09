#!/usr/bin/env node

import { resolve, relative, dirname } from 'node:path'
import * as process from 'node:process'
import yargs from 'yargs'
import prexit from 'prexit'
import { hideBin } from 'yargs/helpers'
import { reportPretty } from '@steiger/pretty-reporter'
import { fromError } from 'zod-validation-error'
import { cosmiconfig } from 'cosmiconfig'

import { linter } from './app'
import { processConfiguration, $plugins } from './models/config'
import { applyAutofixes } from './features/autofix'
import { chooseRootFolderFromGuesses, chooseRootFolderFromSimilar, ExitException } from './features/choose-root-folder'
import fsd from '@feature-sliced/steiger-plugin'
import type { Diagnostic } from '@steiger/types'
import packageJson from '../package.json'
import { existsAndIsFolder } from './shared/file-system'

const { config, filepath } = (await cosmiconfig('steiger').search()) ?? { config: null, filepath: undefined }
const defaultConfig = fsd.configs.recommended

try {
  const configLocationDirectory = filepath ? dirname(filepath) : null
  // use FSD recommended config as a default
  processConfiguration(config || defaultConfig, configLocationDirectory)
} catch (err) {
  if (filepath !== undefined) {
    console.error(
      fromError(err, { prefix: `Invalid configuration in ${relative(process.cwd(), filepath)}` }).toString(),
    )
    process.exit(100)
  }
}

const yargsProgram = yargs(hideBin(process.argv))
  .scriptName('steiger')
  .usage('$0 [options] <path>')
  .option('watch', {
    alias: 'w',
    demandOption: false,
    describe: 'watch filesystem changes',
    type: 'boolean',
  })
  .option('fix', {
    demandOption: false,
    describe: 'apply auto-fixes',
    type: 'boolean',
  })
  .option('fail-on-warnings', {
    demandOption: false,
    describe: 'exit with an error code if there are warnings',
    type: 'boolean',
  })
  .option('reporter', {
    demandOption: false,
    describe: 'specify output format (pretty or json)',
    type: 'string',
    choices: ['pretty', 'json'],
    default: 'pretty',
  })
  .string('_')
  .check((argv) => {
    const filePaths = argv._
    if (filePaths.length > 1) {
      throw new Error('Pass only one path to watch')
    } else {
      return true
    }
  })
  .help('help', 'display help message')
  .alias('help', 'h')
  .version(
    [
      packageJson.version,
      $plugins
        .getState()
        .map((plugin) => `${plugin.meta.name}\t${plugin.meta.version}`)
        .join('\n'),
    ]
      .filter(Boolean)
      .join('\n\n'),
  )
  .alias('version', 'v')
  .showHelpOnFail(true)

const consoleArgs = yargsProgram.parseSync()
const inputPaths = consoleArgs._

let targetPath: string | undefined
if (inputPaths.length > 0) {
  if (await existsAndIsFolder(inputPaths[0])) {
    targetPath = resolve(inputPaths[0])
  } else {
    try {
      targetPath = resolve(await chooseRootFolderFromSimilar(inputPaths[0]))
    } catch (e) {
      if (e instanceof ExitException) {
        process.exit(0)
      } else {
        throw e
      }
    }
  }
} else {
  try {
    targetPath = resolve(await chooseRootFolderFromGuesses())
  } catch (e) {
    if (e instanceof ExitException) {
      process.exit(0)
    } else {
      throw e
    }
  }
}

const printDiagnostics = (diagnostics: Array<Diagnostic>) => {
  if (consoleArgs.reporter === 'json') {
    console.log(JSON.stringify(diagnostics, null, 2))
  } else {
    reportPretty(diagnostics, process.cwd())
  }
}

if (consoleArgs.watch) {
  const [diagnosticsChanged, stopWatching] = await linter.watch(targetPath)
  const unsubscribe = diagnosticsChanged.watch((state) => {
    console.clear()
    printDiagnostics(state)
    if (consoleArgs.fix) {
      applyAutofixes(state)
    }
  })
  prexit(() => {
    stopWatching()
    unsubscribe()
  })
} else {
  const diagnostics = await linter.run(targetPath)
  let stillRelevantDiagnostics = diagnostics

  printDiagnostics(diagnostics)

  if (consoleArgs.fix) {
    stillRelevantDiagnostics = await applyAutofixes(diagnostics)
  }

  if (stillRelevantDiagnostics.length > 0) {
    const onlyWarnings = stillRelevantDiagnostics.every((d) => d.severity === 'warn')
    if (consoleArgs['fail-on-warnings'] || !onlyWarnings) {
      process.exit(1)
    }
  }
}
