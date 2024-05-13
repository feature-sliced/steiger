import { createEffectorArray } from '../shared/create-effector-array'

import { FsUnit } from './fs-units'

export interface Term {
  name: string
  fn: (fsUnit: FsUnit) => boolean
}

export const terms = createEffectorArray<Term>([])
