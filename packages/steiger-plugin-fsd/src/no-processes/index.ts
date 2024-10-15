import { basename } from 'node:path'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'
import { NAMESPACE } from '../constants.js'

const noProcesses = {
  name: `${NAMESPACE}/no-processes` as const,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    const processesLayer = root.children.find(
      (child) => child.type === 'folder' && basename(child.path) === 'processes',
    )

    if (processesLayer !== undefined) {
      diagnostics.push({
        message: 'Layer "processes" is deprecated, avoid using it',
        location: { path: processesLayer.path },
      })
    }

    return { diagnostics }
  },
} satisfies Rule

export default noProcesses
