import { fromError } from 'zod-validation-error'

import { config, Config } from '../models/infractructure/config'

const configDefault: Partial<Config> = {
  skipFsErrors: false,
  skipParseErrors: false,
  fileSizeLimit: 10000,
  fileNumberLimit: 1000,
  watch: false,
  typescript: true,
  gitignore: true,
  npmignore: true,
  fsdignore: true,
}

export const loadConfig = (configToLoad: Config) => {
  const configMerged = { ...configDefault, ...configToLoad }
  const parsingResult = config.schema.safeParse(configMerged)
  if (parsingResult.success) {
    config.set(parsingResult.data)
  } else {
    throw Error(fromError(parsingResult.error).toString())
  }
}
