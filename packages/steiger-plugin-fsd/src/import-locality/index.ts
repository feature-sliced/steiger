import * as fs from 'node:fs'
import { relative, join } from 'node:path'
import { resolveImport } from '@feature-sliced/filesystem'
import precinct from 'precinct'
const { paperwork } = precinct
import { parse as parseNearestTsConfig } from 'tsconfck'

import type { Diagnostic, Rule } from '../types.js'
import { indexSourceFiles } from '../_lib/index-source-files.js'

const importLocality = {
  name: 'import-locality',
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
          const sourceRelativePath = relative(root.path, sourceFile.file.path)
          const dependencyRelativePath = relative(root.path, dependencyLocation.file.path)
          diagnostics.push({
            message: `Import from "${sourceRelativePath}" to "${dependencyRelativePath} should not be relative.`,
          })
        } else if (!isRelative && isWithinSameSlice) {
          const sourceRelativePath = relative(
            join(...[root.path, sourceFile.layerName, sourceFile.sliceName].filter(Boolean)),
            sourceFile.file.path,
          )
          const dependencyRelativePath = relative(
            join(...[root.path, dependencyLocation.layerName, dependencyLocation.sliceName].filter(Boolean)),
            dependencyLocation.file.path,
          )
          const layerAndSlice = join(...[dependencyLocation.layerName, dependencyLocation.sliceName].filter(Boolean))

          diagnostics.push({
            message: `Import on "${layerAndSlice}" from "${sourceRelativePath}" to "${dependencyRelativePath}" should be relative.`,
          })
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default importLocality
