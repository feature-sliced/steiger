import { combine, createEvent, createStore } from 'effector'
import { treeifyPaths } from 'treeify-paths'
import { debug } from 'patronum'

export interface FileRaw {
  pathAbsolute: string
  pathRoot: string
  pathRelative: string
  content: string
}

const filesMap = createStore<Map<FileRaw['pathAbsolute'], FileRaw>>(new Map())
const filesList = combine(filesMap, (filesMap) => Array.from(filesMap.values()))
const filesTree = combine(filesList, (filesList) =>
  treeifyPaths(filesList.map((f) => f.pathAbsolute)),
)

const filesAdd = createEvent<FileRaw>()
filesMap.on(filesAdd, (state, payload) => {
  if (!state.has(payload.pathAbsolute)) {
    state.set(payload.pathAbsolute, payload)
    return new Map(state)
  } else return state
})

const filesChange = createEvent<FileRaw>()
filesMap.on(filesChange, (state, payload) => {
  if (!state.has(payload.pathAbsolute)) {
    state.set(payload.pathAbsolute, payload)
    return new Map(state)
  } else return state
})

const filesRemove = createEvent<FileRaw['pathAbsolute']>()
filesMap.on(filesRemove, (state, pathAbsolute) => {
  if (state.has(pathAbsolute)) {
    state.delete(pathAbsolute)
    return new Map(state)
  } else return state
})

export const files = {
  map: filesMap,
  list: filesList,
  tree: filesTree,
  add: filesAdd,
  change: filesChange,
  remove: filesRemove,
}

debug({ filesList })
