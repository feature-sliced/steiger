import { createEffectorArray } from '../../shared/create-effector-array'

import { Fix } from 'fsd-rules/src/types'

export interface Diagnostic {
  // TODO DB-like normalized structure with relations between engine entities
  // fsUnit: FsUnit['path']
  // rule: Rule['name']
  message: string
  fixes?: Array<Fix>
}

export const diagnostics = createEffectorArray<Diagnostic>([])
