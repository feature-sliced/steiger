import { createEffectorArray } from '../shared/create-effector-array'

import { FsUnit } from './fs-units'
import { Rule } from './rules'

export interface Warning {
  fsUnit: FsUnit['path']
  rule: Rule['name']
}

export const warnings = createEffectorArray<Warning>([])
