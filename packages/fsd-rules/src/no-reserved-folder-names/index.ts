import { basename, join, relative } from 'node:path'
import { getAllSegments } from '@feature-sliced/filesystem'

import type { Diagnostic, Rule } from '../types.js'
import { findAllRecursively } from '../_lib/find-all-recursively.js'

const conventionalSegmentNames = ['ui', 'api', 'lib', 'model', 'config']

/** Forbid subfolders in segments that have names of common segments (e.g., shared/lib/ui). */
const noReservedFolderNames = {
  name: 'no-reserved-folder-names',
  check(root) {
    const diagnostics: Array<Diagnostic> = []

    for (const { segment, layerName, sliceName, segmentName } of getAllSegments(root)) {
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
          const semanticLocation = join(...[layerName, sliceName, segmentName].filter(Boolean))
          diagnostics.push({
            message: `Folder name "${relative(segment.path, violatingFolder.path)}" in "${semanticLocation}" is reserved for segment names`,
          })
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default noReservedFolderNames
