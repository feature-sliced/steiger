import { basename } from 'node:path'
import type { Diagnostic, Rule } from '../types.js'

const noProcesses = {
  name: 'no-processes',
  check(root) {
    const diagnostics: Array<Diagnostic> = []

    const processesLayer = root.children.find(
      (child) => child.type === 'folder' && basename(child.path) === 'processes',
    )

    if (processesLayer !== undefined) {
      diagnostics.push({
        message: 'Layer "processes" is deprecated, avoid using it',
      })
    }

    return { diagnostics }
  },
} satisfies Rule

export default noProcesses
