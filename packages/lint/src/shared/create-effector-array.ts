import { createEvent, createStore } from 'effector'

export const createEffectorArray = <T>(initialValue: Array<T>) => {
  const store = createStore<Array<T>>(initialValue)

  const create = createEvent<T>()
  store.on(create, (state, payload) => [...state, payload])

  const updateIndex = createEvent<[number, T]>()
  store.on(updateIndex, (state, [index, value]) => {
    if (index <= state.length) {
      state[index] = value
      return [...state]
    } else {
      throw Error('index cannot be larger than elements count')
    }
  })

  const findOneAndUpdate = createEvent<[(value: T, index: number) => boolean, T]>()
  store.on(findOneAndUpdate, (state, [findFn, value]) => {
    const foundIndex = state.findIndex((v, i) => findFn(v, i))
    if (foundIndex) {
      state[foundIndex] = value
      return [...state]
    } else {
      throw Error('element with given conditions not found')
    }
  })

  const removeIndex = createEvent<number>()
  store.on(removeIndex, (state, index) => {
    if (index <= state.length) {
      state.splice(index, 1)
      return [...state]
    } else {
      throw Error('index cannot be larger than elements count')
    }
  })

  const findAndRemove = createEvent<(value: T, index: number) => boolean>()
  store.on(findAndRemove, (state, findFn) => {
    const foundIndex = state.findIndex((v, i) => findFn(v, i))
    if (foundIndex) {
      state.splice(foundIndex, 1)
      return [...state]
    } else {
      throw Error('element with given conditions not found')
    }
  })

  return {
    store,
    create,
    updateIndex,
    findOneAndUpdate,
    removeIndex,
    findAndRemove,
  }
}
