import { createEvent, createStore } from 'effector'

export const createEffectorArray = <T>(initialValue: Array<T>) => {
  const store = createStore<Array<T>>(initialValue)

  const create = createEvent<T>()
  store.on(create, (state, payload) => state)

  const updateIndex = createEvent<[(value: T, index: T) => boolean, T]>()
  store.on(updateIndex, (state, payload) => state)

  const findAndUpdate = createEvent<number>()
  store.on(findAndUpdate, (state, payload) => state)

  const removeIndex = createEvent<number>()
  store.on(removeIndex, (state, payload) => state)

  const findAndRemove = createEvent<(value: T, index: T) => boolean>()
  store.on(findAndRemove, (state, payload) => state)

  return {
    store,
    create,
    updateIndex,
    findAndUpdate,
    removeIndex,
    findAndRemove,
  }
}
