import yargs from 'yargs'
import prexit from 'prexit'
import { hideBin } from 'yargs/helpers'

import {
  configDefault,
  ConfigInternal,
  configInternalSchema,
} from './shared/config'

import { createLinter } from './app'

const consoleArgs = yargs(hideBin(process.argv)).parse()

console.log('consoleArgs', consoleArgs)

const configInternal: ConfigInternal = configInternalSchema.parse({
  ...configDefault,
  ...consoleArgs,
})

const linter = createLinter(configInternal)

linter.watch(console.log)

prexit(async () => {
  await linter.close()
})
