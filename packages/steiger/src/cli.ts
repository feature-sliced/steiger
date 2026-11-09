#!/usr/bin/env node

import { resolve, relative, dirname } from 'node:path'
import * as process from 'node:process'
import yargs from 'yargs'
import prexit from 'prexit'
import { statSync } from 'node:fs'
import { hideBin } from 'yargs/helpers'
import { reportPretty } from '@steiger/pretty-reporter'
import { cosmiconfig } from 'cosmiconfig'
import * as find from 'empathic/find'
import z from 'zod'

import { linter } from './app'
import { $globalConfig, processConfiguration } from './models/config'
import { applyAutofixes } from './features/autofix'
import { chooseRootFolderFromGuesses, chooseRootFolderFromSimilar, ExitException } from './features/choose-root-folder'
import fsd from '@feature-sliced/steiger-plugin'
import type { Diagnostic } from '@steiger/types'
import packageJson from '../package.json'
import { existsAndIsFolder } from './shared/file-system'

const defaultConfig = fsd.configs.recommended
const configExplorer = cosmiconfig('steiger', { searchStrategy: 'none' })
const rawArgs = hideBin(process.argv)

function createVersionString() {
  return [
    packageJson.version,
    $globalConfig
      .getState()!
      .plugins.map((plugin) => `${plugin.meta.name}\t${plugin.meta.version}`)
      .join('\n'),
  ]
    .filter(Boolean)
    .join('\n\n')
}

async function searchConfiguration(searchFrom: string) {
  let directory = resolve(searchFrom)
  const gitFolder = find.up('.git', { cwd: directory })
  const gitRoot = gitFolder ? dirname(gitFolder) : undefined

  while (true) {
    const result = await configExplorer.search(directory)
    if (result) {
      return result
    }

    const parent = dirname(directory)
    if (directory === gitRoot || parent === directory) {
      return null
    }
    directory = parent
  }
}

function reportConfigError(err: unknown, filepath: string): never {
  const prefix = `Invalid configuration in ${relative(process.cwd(), filepath)}`
  const message =
    err instanceof z.ZodError ? z.prettifyError(err) : err instanceof Error ? err.message : 'Unknown error'
  console.error(`${prefix}: ${message}`)

  process.exit(100)
}

function formatConfigLoadingError(error: unknown, configFilePath: string): string {
  if (!(error instanceof Error)) return String(error)

  // JSON/YAML loader errors from cosmiconfig already embed the file path in their message
  const hasEmbeddedPath =
    'filepath' in error && typeof error.filepath === 'string' && error.message.includes(error.filepath)

  if (hasEmbeddedPath) {
    return `${error.name}: ${error.message}`
  }
  return `${error.name} while loading config at "${configFilePath}": ${error.message}`
}

async function loadConfiguration(searchFrom: string, opts?: { warnWhenUsingDefault?: boolean }) {
  const { config, filepath } = (await searchConfiguration(searchFrom)) ?? { config: null, filepath: undefined }

  try {
    const configLocationDirectory = filepath ? dirname(filepath) : null

    // use FSD recommended config as a default
    let configToProcess
    if (config) {
      configToProcess = config
    } else {
      if (opts?.warnWhenUsingDefault ?? true) {
        console.error(
          `No usable configuration file found in ${relative(process.cwd(), searchFrom) || searchFrom} or its parent directories, using default config`,
        )
      }
      configToProcess = defaultConfig
    }

    processConfiguration(configToProcess, configLocationDirectory)
  } catch (err) {
    if (filepath !== undefined) {
      reportConfigError(err, filepath)
    }
  }
}

async function loadExplicitConfiguration(configFilePath: string) {
  let stats
  try {
    stats = statSync(configFilePath, { throwIfNoEntry: false })
  } catch (e) {
    console.error(formatConfigLoadingError(e, configFilePath))
    process.exit(100)
  }
  if (stats?.isFile() !== true) {
    console.error(`No configuration file found at "${configFilePath}"`)
    process.exit(100)
  }

  let result
  try {
    result = await configExplorer.load(configFilePath)
  } catch (e) {
    console.error(formatConfigLoadingError(e, configFilePath))
    process.exit(100)
  }
  if (result == null || result.config == null) {
    console.error(`No steiger configuration found in "${configFilePath}"`)
    process.exit(100)
  }

  try {
    processConfiguration(result.config, dirname(result.filepath))
  } catch (err) {
    reportConfigError(err, result.filepath)
  }
}

const yargsProgram = yargs(rawArgs)
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
  .option('ignore-warnings', {
    demandOption: false,
    describe: 'report errors only',
    type: 'boolean',
  })
  .conflicts('ignore-warnings', 'fail-on-warnings')
  .option('reporter', {
    demandOption: false,
    describe: 'specify output format (pretty or json)',
    type: 'string',
    choices: ['pretty', 'json'],
    default: 'pretty',
  })
  .option('config', {
    alias: 'c',
    demandOption: false,
    describe: 'config file path',
    type: 'string',
  })
  .string('_')
  .check((argv) => {
    const filePaths = argv._
    if (filePaths.length > 1) {
      throw new Error('Pass only one path to watch')
    } else if (argv.config === '') {
      throw new Error('Pass a file path when using --config')
    } else {
      return true
    }
  })
  .help('help', 'display help message')
  .alias('help', 'h')
  .version(packageJson.version)
  .alias('version', 'v')
  .showHelpOnFail(true)

let parseError: Error | undefined
let parseOutput = ''
const consoleArgs = yargsProgram.parseSync(rawArgs, {}, (error, _argv, output) => {
  parseError = error
  parseOutput = output
})

if (parseError && !consoleArgs.help) {
  console.error(parseOutput)
  process.exit(1)
}

if (parseOutput) {
  if (consoleArgs.version) {
    if (consoleArgs.config !== undefined) {
      await loadExplicitConfiguration(resolve(consoleArgs.config))
    } else {
      await loadConfiguration(process.cwd(), { warnWhenUsingDefault: false })
    }
    console.log(createVersionString())
  } else {
    console.log(parseOutput)
  }
  process.exit(0)
}

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

if (consoleArgs.config !== undefined) {
  await loadExplicitConfiguration(resolve(consoleArgs.config))
} else {
  await loadConfiguration(targetPath)
}

const printDiagnostics = (diagnostics: Array<Diagnostic>) => {
  const diagnosticsToReport = consoleArgs['ignore-warnings']
    ? diagnostics.filter((diagnostic) => diagnostic.severity === 'error')
    : diagnostics

  if (consoleArgs.reporter === 'json') {
    console.log(JSON.stringify(diagnosticsToReport, null, 2))
  } else {
    reportPretty(diagnosticsToReport, process.cwd())
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
