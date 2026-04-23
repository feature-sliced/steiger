#!/usr/bin/env node

import { resolve, relative, dirname } from 'node:path'
import * as process from 'node:process'
import yargs from 'yargs'
import prexit from 'prexit'
import { hideBin } from 'yargs/helpers'
import { reportPretty } from '@steiger/pretty-reporter'
import { fromError } from 'zod-validation-error'
import { cosmiconfig } from 'cosmiconfig'
import type { Diagnostic } from '@steiger/types'

import { linter } from './app'
import { processConfiguration, $plugins } from './models/config'
import { applyAutofixes } from './features/autofix'
import { chooseRootFolderFromGuesses, chooseRootFolderFromSimilar } from './features/choose-root-folder'
import { discoverPlugins, suggestInstallingFsdPlugin } from './features/discover-plugins'
import { handleExitRequest } from './shared/exit-exception'
import packageJson from '../package.json'
import { existsAndIsFolder } from './shared/file-system'

const { config, filepath } = (await cosmiconfig('steiger').search()) ?? { config: null, filepath: null }

if (config !== null && filepath !== null) {
  const configLocationDirectory = dirname(filepath)
  try {
    processConfiguration(config, configLocationDirectory)
  } catch (err) {
    console.error(
      fromError(err, { prefix: `Invalid configuration in ${relative(process.cwd(), filepath)}` }).toString(),
    )
    process.exit(100)
  }
} else {
  let installedPlugins = await discoverPlugins()
  if (installedPlugins.length === 0) {
    try {
      await handleExitRequest(suggestInstallingFsdPlugin, { exitCode: 0 })
    } catch {
      // In this case, the error message is already printed, we just need to exit
      process.exit(102)
    }
    installedPlugins = await discoverPlugins()

    if (installedPlugins.length === 0) {
      console.error(
        "Sorry, I tried to add the FSD plugin, but it didn't work :(\n" +
          `Please report this case to ${packageJson.bugs.url}`,
      )
      process.exit(101)
    }
  }

  try {
    processConfiguration(
      installedPlugins
        .map((plugin) => plugin.autoConfig)
        .filter(Boolean)
        .flat(),
      null,
    )
  } catch (err) {
    console.error(
      fromError(err, {
        prefix: `Failed to auto-construct a configuration from plugins ${installedPlugins.map(({ plugin }) => `"${plugin.meta.name}"`).join(', ')}`,
      }).toString(),
    )
    process.exit(103)
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
    await handleExitRequest(
      async () => {
        targetPath = resolve(await chooseRootFolderFromSimilar(inputPaths[0]))
      },
      { exitCode: 0 },
    )
  }
} else {
  await handleExitRequest(
    async () => {
      targetPath = resolve(await chooseRootFolderFromGuesses())
    },
    { exitCode: 0 },
  )
}

const printDiagnostics = (diagnostics: Array<Diagnostic>) => {
  if (consoleArgs.reporter === 'json') {
    console.error(JSON.stringify(diagnostics, null, 2))
  } else {
    reportPretty(diagnostics, process.cwd())
  }
}

if (consoleArgs.watch) {
  const [diagnosticsChanged, stopWatching] = await linter.watch(targetPath!)
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
  const diagnostics = await linter.run(targetPath!)
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
