#!/usr/bin/env node

import yargs from 'yargs'
import prexit from 'prexit'
import { hideBin } from 'yargs/helpers'
import z from 'zod'
import { createStore, combine, createEvent } from 'effector'
import { treeifyPaths } from 'treeify-paths'
import { debug } from 'patronum'
import path from 'node:path'
import fs from 'node:fs/promises'
import chokidar from 'chokidar'

const configSchema = z.object({
  path: z.string(),
  skipFsErrors: z.boolean().optional(),
  skipParseErrors: z.boolean().optional(),
  fileSizeLimit: z.number().optional(),
  fileNumberLimit: z.number().optional(),
  watch: z.boolean().optional(),
})
const configInternalSchema = configSchema.extend({
  cwd: z.string(),
})
const configDefault = {
  cwd: process.cwd(),
  skipFsErrors: false,
  skipParseErrors: false,
  fileSizeLimit: 10000,
  fileNumberLimit: 1000,
  watch: false,
}

const filesMap = createStore(new Map())
const filesList = combine(filesMap, (filesMap) => Array.from(filesMap.values()))
const filesTree = combine(filesList, (filesList) => treeifyPaths(filesList.map((f) => f.pathAbsolute)))
const filesAdd = createEvent()
filesMap.on(filesAdd, (state, payload) => {
  if (!state.has(payload.pathAbsolute)) {
    state.set(payload.pathAbsolute, payload)
    return new Map(state)
  } else return state
})
const filesChange = createEvent()
filesMap.on(filesChange, (state, payload) => {
  if (!state.has(payload.pathAbsolute)) {
    state.set(payload.pathAbsolute, payload)
    return new Map(state)
  } else return state
})
const filesRemove = createEvent()
filesMap.on(filesRemove, (state, pathAbsolute) => {
  if (state.has(pathAbsolute)) {
    state.delete(pathAbsolute)
    return new Map(state)
  } else return state
})
const files = {
  map: filesMap,
  list: filesList,
  tree: filesTree,
  add: filesAdd,
  change: filesChange,
  remove: filesRemove,
}
debug({ filesList })

const createWatcher = (watchRoot, config) => {
  const fsWatcher = chokidar.watch(watchRoot, {
    ignoreInitial: false,
    alwaysStat: true,
    awaitWriteFinish: true,
    disableGlobbing: true,
    cwd: config.cwd,
  })
  fsWatcher.on('add', async (pathRelative, stats) => {
    files.add({
      pathRelative,
      pathAbsolute: path.join(watchRoot, pathRelative),
      pathRoot: watchRoot,
      content: (await fs.readFile(path.join(watchRoot, pathRelative))).toString(),
    })
  })
  fsWatcher.on('change', async (pathRelative, stats) => {
    files.change({
      pathRelative,
      pathAbsolute: path.join(watchRoot, pathRelative),
      pathRoot: watchRoot,
      content: (await fs.readFile(path.join(watchRoot, pathRelative))).toString(),
    })
  })
  fsWatcher.on('unlink', async (pathRelative) => {
    files.remove(pathRelative)
  })
  return {
    close: async () => await fsWatcher.close(),
  }
}

const createLinter = (config) => {
  configSchema.parse(config)
  const configInternal = configInternalSchema.parse({
    ...configDefault,
    ...config,
  })
  const watcher = createWatcher(configInternal.path, configInternal)
  return {
    watch: (cb) => {
      files.list.watch(cb)
    },
    close: async () => {
      await watcher.close()
    },
  }
}

const consoleArgs = yargs(hideBin(process.argv)).parse()
console.log('consoleArgs', consoleArgs)
const configInternal = configInternalSchema.parse({
  ...configDefault,
  ...consoleArgs,
})
const linter = createLinter(configInternal)
linter.watch(console.log)
prexit(async () => {
  await linter.close()
})
