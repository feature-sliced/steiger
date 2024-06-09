#!/usr/bin/env node

import { resolve, relative } from 'node:path'
import * as process from 'node:process'
import yargs from 'yargs'
import prexit from 'prexit'
import { hideBin } from 'yargs/helpers'
import { reportPretty } from '@steiger/pretty-reporter'
import { fromError } from 'zod-validation-error'
import { cosmiconfig } from 'cosmiconfig'

import { linter } from './app'
import { setConfig, schema as configSchema } from './models/config'

const yargsProgram = yargs(hideBin(process.argv))
  .scriptName('steiger')
  .usage('$0 [options] <path>')
  .option('watch', {
    alias: 'w',
    demandOption: false,
    describe: 'watch filesystem changes',
    type: 'boolean',
  })
  .string('_')
  .check((argv) => {
    const filePaths = argv._
    if (filePaths.length > 1) {
      throw new Error('Pass only one path to watch')
    } else if (filePaths.length === 0) {
      throw new Error('Pass a path to watch')
    } else {
      return true
    }
  })
  .help('help', 'display help message')
  .alias('help', 'h')
  .version()
  .alias('version', 'v')
  .showHelpOnFail(true)

const consoleArgs = yargsProgram.parseSync()

const { config, filepath } = (await cosmiconfig('steiger').search()) ?? { config: null, filepath: undefined }

try {
  setConfig(configSchema.parse(config))
} catch (err) {
  if (filepath !== undefined) {
    console.error(
      fromError(err, { prefix: `Invalid configuration in ${relative(process.cwd(), filepath)}` }).toString(),
    )
    process.exit(100)
  }
}

if (consoleArgs.watch) {
  const [diagnosticsChanged, stopWatching] = await linter.watch(resolve(consoleArgs._[0]))
  const unsubscribe = diagnosticsChanged.watch((state) => {
    console.clear()
    reportPretty(state)
  })
  prexit(() => {
    stopWatching()
    unsubscribe()
  })
} else {
  await linter.run(resolve(consoleArgs._[0])).then(reportPretty)
}
