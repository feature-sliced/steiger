import { files } from './model/files'
import { configSchema, Config, configInternalSchema, ConfigInternal, configDefault } from './shared/config'
import { createWatcher } from './services/watcher'

export const createLinter = (config: Config) => {
  configSchema.parse(config)
  const configInternal: ConfigInternal = configInternalSchema.parse({
    ...configDefault,
    ...config,
  })

  const watcher = createWatcher(configInternal.path, configInternal)

  return {
    watch: (cb: (files: any) => void) => {
      files.list.watch(cb)
    },
    close: async () => {
      await watcher.close()
    },
  }
}
