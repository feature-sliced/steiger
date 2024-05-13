import nodePath from 'node:path'
import { configSchema, Config, configInternalSchema, ConfigInternal, configDefault } from './shared/config'

import { createWatcher } from './services/watcher'
import { warnings } from './models/warnings'

export const createLinter = (config: Config) => {
  configSchema.parse(config)
  const configInternal: ConfigInternal = configInternalSchema.parse({
    ...configDefault,
    ...config,
  })

  const watcher = createWatcher(nodePath.join(configInternal.cwd, configInternal.path), configInternal)

  return {
    watch: (cb: (files: any) => void) => {
      warnings.store.watch(cb)
    },
    close: async () => {
      await watcher.close()
    },
  }
}
