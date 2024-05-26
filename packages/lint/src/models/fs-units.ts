import nodePath from 'node:path'

import { createEvent, createStore } from 'effector'
import { File, Folder, FsdRoot } from '@feature-sliced/filesystem'

const tree = createStore<FsdRoot>({ type: 'folder', path: '/', children: [] })

tree.watch(value => {
  console.log(JSON.stringify(value, null, 2))
})

const add = createEvent<File>()
tree.on(add, (state, payload) => {
  let currentFolder = state
  const pathSegments = payload.path.split(nodePath.sep).slice(0, -1)
  pathSegments.forEach((pathSegment, index, pathSegments) => {
    const childToFoundPath = pathSegments.slice(0, index + 1).join(nodePath.sep)
    let foundChildren = currentFolder.children.find((c) => c.path === childToFoundPath)
    if (!foundChildren) currentFolder.children.push({ type: 'folder', path: childToFoundPath, children: [] })
    foundChildren = currentFolder.children.find((c) => c.path === childToFoundPath)
    currentFolder = foundChildren as Folder
  })
  currentFolder.children.push({
    type: 'file',
    path: payload.path
  })
  return { ...state }
})

const change = createEvent<File>()
tree.on(change, (state, payload) => {})

const remove = createEvent<File['path']>()
tree.on(remove, (state, pathAbsolute) => {})

// TODO DB-like normalized structure with relations between engine entities

// const map = createStore<Map<FsUnit['path'], FsUnit>>(new Map())
/*
map.on(add, (state, payload) => {
  if (!state.has(payload.path)) {
    state.set(payload.path, payload)
    return new Map(state)
  } else return state
})

map.on(change, (state, payload) => {
  if (!state.has(payload.path)) {
    state.set(payload.path, payload)
    return new Map(state)
  } else return state
})

map.on(remove, (state, pathAbsolute) => {
  if (state.has(pathAbsolute)) {
    state.delete(pathAbsolute)
    return new Map(state)
  } else return state
})
*/

// const list = combine(map, (filesMap) => Array.from(filesMap.values()))

export const fsUnits = {
  tree,
  add,
  change,
  remove,
}
