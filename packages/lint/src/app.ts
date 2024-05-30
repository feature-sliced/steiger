import { createMockRules } from './features/create-mock-rules'

export { type Rule, type RuleResult } from './models/business/rules'
export { type Diagnostic } from './models/business/diagnostics'
export { type Config } from './models/infractructure/config'

import { runRulesOnVfs } from './features/run-rules-on-vfs'
import { loadEnvironment } from './features/load-environment'
import { diagnostics } from './models/business/diagnostics'
import { loadConfig } from './features/load-config'
import { watcher } from './features/transfer-fs-to-vfs'

const start = () => {
  watcher.start()
  runRulesOnVfs()
  createMockRules()
}
const stop = () => watcher.stop()

export const linter = {
  loadConfig,
  loadEnvironment,
  start,
  diagnostics: diagnostics.store,
  stop,
}
