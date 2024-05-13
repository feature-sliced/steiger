import { createEffectorArray } from '../shared/create-effector-array'

import { FsUnit } from './fs-units'
import { Warning } from './warnings'

export interface Rule {
  name: string
  fn: (fsUnits: Array<FsUnit>) => null | Warning | Array<Warning>
}

export const rules = createEffectorArray<Rule>([])
