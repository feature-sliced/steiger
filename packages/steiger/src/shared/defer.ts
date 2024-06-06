/** Copy-pasted from https://github.com/effector/patronum/pull/330, remove when it's merged. */

import { type Store, type Unit, merge, sample } from 'effector'
import { combineEvents, not } from 'patronum'

export interface DeferArgs {
  clock: Unit<any>
  until: Store<boolean>
}

export const defer = (args: DeferArgs) => {
  const { clock, until: condition } = args

  const calledAfterCondition = sample({
    clock: clock,
    filter: condition,
  })

  const calledBeforeCondition = sample({
    clock: clock,
    filter: not(condition),
  })

  return merge([
    calledAfterCondition,
    combineEvents({
      events: [calledBeforeCondition, condition.updates.filter({ fn: Boolean })],
      reset: condition.updates.filter({ fn: (value) => !value }),
    }),
  ])
}
