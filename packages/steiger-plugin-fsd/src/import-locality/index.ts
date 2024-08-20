import * as fs from 'node:fs'
import { resolveImport } from '@feature-sliced/filesystem'
import precinct from 'precinct'
const { paperwork } = precinct
import { parse as parseNearestTsConfig } from 'tsconfck'
import type { Diagnostic, Rule } from '@steiger/toolkit'

import { indexSourceFiles } from '../_lib/index-source-files.js'
import { NAMESPACE } from '../constants.js'

const importLocality = {
  name: `${NAMESPACE}/import-locality`,
  async check(root) {
    const diagnostics: Array<Diagnostic> = []
    const { tsconfig } = await parseNearestTsConfig(root.path)
    const sourceFileIndex = indexSourceFiles(root)

    for (const sourceFile of Object.values(sourceFileIndex)) {
      const dependencies = paperwork(sourceFile.file.path, { includeCore: false, fileSystem: fs })
      for (const dependency of dependencies) {
        const resolvedDependency = resolveImport(
          dependency,
          sourceFile.file.path,
          tsconfig?.compilerOptions ?? {},
          fs.existsSync,
          fs.existsSync,
        )
        if (resolvedDependency === null) {
          continue
        }

        const dependencyLocation = sourceFileIndex[resolvedDependency]
        if (dependencyLocation === undefined) {
          continue
        }

        const isRelative = ['.', '..'].includes(dependency.split('/')[0])
        const isWithinSameSlice =
          sourceFile.layerName === dependencyLocation.layerName && sourceFile.sliceName === dependencyLocation.sliceName

        if (isRelative && !isWithinSameSlice) {
          diagnostics.push({
            message: `Import from "${dependency}" should not be relative.`,
            location: { path: sourceFile.file.path },
          })
        } else if (!isRelative && isWithinSameSlice) {
          diagnostics.push({
            message: `Import from "${dependency}" should be relative.`,
            location: { path: sourceFile.file.path },
          })
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default importLocality
