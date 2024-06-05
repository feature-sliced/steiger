import { resolve } from 'node:path'
import yargs from 'yargs'
import prexit from 'prexit'
import { hideBin } from 'yargs/helpers'
import { reportPretty } from 'pretty-reporter'
import { findUp } from 'find-up'

import { linter } from './app'
import { setConfig } from './models/config'

const CONFIG_FILENAMES = ['fsd-lint.config.js', 'fsd-lint.config.mjs', 'fsd-lint.config.cjs']

const yargsProgram = yargs(hideBin(process.argv))
  .scriptName('fsd-lint')
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

const configFilePath = await findUp(CONFIG_FILENAMES, { type: 'file' })
const config = configFilePath !== undefined ? (await import(configFilePath)).default : {}
setConfig(config)

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
