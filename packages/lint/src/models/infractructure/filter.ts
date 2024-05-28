import nodeFs from 'node:fs'
import nodePath from 'node:path'

import ignore from 'ignore'
import { glob } from 'glob'
import { createEvent, createStore, sample } from 'effector'

import { config, Config } from './config'
import { Environment, environment } from './environment'

export type Filter = (pathRelative: string) => boolean

const store = createStore<Filter | null>(null)
const set = createEvent<Filter>()

sample({
  clock: [config.store, environment.store],
  fn: (clock) => {
    const [config, environment] = clock as unknown as [Config, Environment]

    let filterResult: Filter = () => true

    if (config.gitignore) {
      const gitignorePath = nodePath.join(environment.cwd, '.gitignore')
      const gitignoreFileData = nodeFs.readFileSync(gitignorePath, 'utf-8')
      if (gitignoreFileData) {
        const ignoreMatcher = ignore()
        ignoreMatcher.add(gitignoreFileData)
        filterResult = (pathRelative: string) => ignoreMatcher.ignores(pathRelative)
      }
    }

    return filterResult
  },
  target: store,
})

export const filter = {
  store,
  set,
}
