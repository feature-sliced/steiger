import { basename } from 'node:path'
import { getAllSegments, conventionalSegmentNames } from '@feature-sliced/filesystem'
import type { Diagnostic, Rule } from '@steiger/types'

import { findAllRecursively } from '../_lib/find-all-recursively.js'

/** Forbid subfolders in segments that have names of common segments (e.g., shared/lib/ui). */
const noReservedFolderNames = {
  name: 'no-reserved-folder-names',
  check(root) {
    const diagnostics: Array<Diagnostic> = []

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
          (entry) => entry.type === 'folder' && conventionalSegmentNames.includes(basename(entry.path)),
        )) {
          diagnostics.push({
            message: `Having a folder with the name "${basename(violatingFolder.path)}" inside a segment could be confusing because that name is commonly used for segments. Consider renaming it.`,
            location: { path: violatingFolder.path },
          })
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default noReservedFolderNames
