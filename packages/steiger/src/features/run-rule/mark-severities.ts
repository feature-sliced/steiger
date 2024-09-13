import { File, Folder } from '@steiger/types'
import { GlobGroup } from '../../models/config'
import { createFilterAccordingToGlobs } from '../../shared/globs'
import { SeverityMarkedFile, SeverityMarkedFolder } from './types'
import { pipe, map } from 'ramda'

function markDefault(entity: File | Folder): SeverityMarkedFile | SeverityMarkedFolder {
  return {
    ...entity,
    severity: 'off',
  }
}

export default function markSeverities(
  globs: Array<GlobGroup>,
  flatVfs: Array<File | Folder>,
): Array<SeverityMarkedFile | SeverityMarkedFolder> {
  function markAccordingToGlobs(
    fsEntity: SeverityMarkedFolder | SeverityMarkedFile,
  ): SeverityMarkedFile | SeverityMarkedFolder {
    return globs.reduce((acc, { severity, files, ignores }) => {
      const isApplied = createFilterAccordingToGlobs({ inclusions: files, exclusions: ignores })

      const severityApplies = isApplied(acc.path, acc.type)
      return severityApplies
        ? {
            ...acc,
            severity,
          }
        : acc
    }, fsEntity)
  }

  const doMarking = pipe(map(markDefault), map(markAccordingToGlobs))

  return doMarking(flatVfs)
}
