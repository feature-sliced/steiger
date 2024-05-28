import { fromError } from 'zod-validation-error'

import { environment, Environment } from '../models/infractructure/environment'

const environmentDefault: Environment = {
  cwd: process.cwd()
}

export const loadEnvironment = (environmentToLoad: Partial<Environment>) => {
  const environmentMerged = { ...environmentDefault, ...environmentToLoad }
  const parsingResult = environment.schema.safeParse(environmentMerged)
  if (parsingResult.success) {
    environment.set(parsingResult.data)
  } else {
    throw Error(fromError(parsingResult.error).toString())
  }
}
