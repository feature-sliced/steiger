import { Folder, GlobalIgnore, Severity } from '@steiger/types'

import { getGlobalIgnores, GlobGroup } from '../../models/config'
import markFileSeverities from './mark-file-severities'
import propagateSeverityToFolders from './propagate-severity-to-folders'
import markDefault from './mark-default'
import { SeverityMarkedFile, SeverityMarkedFolder } from './types'

export interface VfsSeverityWizard {
  getSeverityForPath(path: string): string | null
}

function markNodesAsExcludedForever(vfs: SeverityMarkedFolder, globalIgnores: Array<GlobalIgnore>) {
  const globalIgnoresTurnedIntoGlobGroups = globalIgnores.map((i) => ({
    severity: 'excluded' as Severity,
    files: i.ignores,
    ignores: [],
  }))

  return propagateSeverityToFolders(markFileSeverities(globalIgnoresTurnedIntoGlobGroups, vfs), false)
}

export default function CreateVfsSeverityWizard(vfs: Folder, globGroups: Array<GlobGroup>): VfsSeverityWizard {
  const afterGlobalIgnores = markNodesAsExcludedForever(<SeverityMarkedFolder>markDefault(vfs), getGlobalIgnores())

  const severityMarkedVfs = propagateSeverityToFolders(markFileSeverities(globGroups, afterGlobalIgnores))

  return {
    getSeverityForPath(path: string) {
      let severity = 'warn'

      const stack: Array<SeverityMarkedFile | SeverityMarkedFolder> = [severityMarkedVfs]

      while (stack.length > 0) {
        const node = stack.pop()!

        if (node.path === path) {
          severity = node.severity
          break
        }

        if (node.type === 'folder') {
          for (let i = 0; i < node.children.length; i++) {
            stack.push((node.children as Array<SeverityMarkedFolder | SeverityMarkedFile>)[i])
          }
        }
      }

      return severity
    },
  }
}
