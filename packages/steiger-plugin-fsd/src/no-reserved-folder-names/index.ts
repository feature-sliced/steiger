import { basename } from 'node:path'
import { getAllSegments, conventionalSegmentNames, crossReferenceToken } from '@feature-sliced/filesystem'
import { findAllRecursively, type PartialDiagnostic, type Rule } from '@steiger/toolkit'

import { NAMESPACE } from '../constants.js'

/** Forbid subfolders in segments that have names of common segments (e.g., shared/lib/ui). */
const noReservedFolderNames = {
  name: `${NAMESPACE}/no-reserved-folder-names` as const,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    for (const { segment } of getAllSegments(root)) {
      if (segment.type === 'file') {
        continue
      }

      for (const child of segment.children) {
        if (child.type === 'file') {
          continue
        }

        for (const violatingFolder of findAllRecursively(
          child,
          (entry) =>
            entry.type === 'folder' &&
            conventionalSegmentNames.concat(crossReferenceToken).includes(basename(entry.path)),
        )) {
          const reservedName = basename(violatingFolder.path)
          if (reservedName === crossReferenceToken) {
            diagnostics.push({
              message: `Having a folder with the name "${crossReferenceToken}" inside a segment could be confusing because that name is reserved for cross-import public APIs. Consider renaming it.`,
              location: { path: violatingFolder.path },
            })
          } else {
            diagnostics.push({
              message: `Having a folder with the name "${basename(violatingFolder.path)}" inside a segment could be confusing because that name is commonly used for segments. Consider renaming it.`,
              location: { path: violatingFolder.path },
            })
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default noReservedFolderNames
