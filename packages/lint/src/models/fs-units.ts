import { combine, createEvent, createStore } from 'effector'

interface FsUnitProto {
  path: string
}

interface FsUnitFile extends FsUnitProto {
  kind: 'file'
  content: string
  imports: Array<FsUnitProto['path']>
}

interface FsUnitDirectory extends FsUnitProto {
  kind: 'directory'
  nested: Array<FsUnit['path']>
}

export type FsUnit = FsUnitFile | FsUnitDirectory

const map = createStore<Map<FsUnit['path'], FsUnit>>(new Map())
const list = combine(map, (filesMap) => Array.from(filesMap.values()))

const add = createEvent<FsUnit>()
map.on(add, (state, payload) => {
  if (!state.has(payload.path)) {
    state.set(payload.path, payload)
    return new Map(state)
  } else return state
})

const change = createEvent<FsUnit>()
map.on(change, (state, payload) => {
  if (!state.has(payload.path)) {
    state.set(payload.path, payload)
    return new Map(state)
  } else return state
})

const remove = createEvent<FsUnit['path']>()
map.on(remove, (state, pathAbsolute) => {
  if (state.has(pathAbsolute)) {
    state.delete(pathAbsolute)
    return new Map(state)
  } else return state
})

export const fsUnits = {
  map,
  list,
  add,
  change,
  remove,
}
