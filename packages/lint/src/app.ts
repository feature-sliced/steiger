export { type Rule, type RuleResult } from './models/business/rules'
export { type Diagnostic } from './models/business/diagnostics'
export { type Config } from './models/infractructure/config'

import { loadEnvironment } from './features/load-environment'
import { diagnostics } from './models/business/diagnostics'
import { loadConfig } from './features/load-config'
import { watcher } from './features/transfer-fs-to-vfs'

const start = () => watcher.start()
const stop = () => watcher.stop()

export const linter = {
  loadConfig,
  loadEnvironment,
  start,
  diagnostics: diagnostics.store,
  stop,
}
