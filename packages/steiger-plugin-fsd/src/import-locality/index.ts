import * as fs from 'node:fs'
import precinct from 'precinct'
const { paperwork } = precinct
import { parse as parseNearestTsConfig } from 'tsconfck'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'

import { indexSourceFiles } from '../_lib/index-source-files.js'
import { collectRelatedTsConfigs } from '../_lib/collect-related-ts-configs.js'
import { resolveDependency } from '../_lib/resolve-dependency.js'
import { NAMESPACE } from '../constants.js'

const importLocality = {
  name: `${NAMESPACE}/import-locality`,
  async check(root) {
    const diagnostics: Array<PartialDiagnostic> = []
    const parseResult = await parseNearestTsConfig(root.path)
    const tsConfigs = collectRelatedTsConfigs(parseResult)
    const sourceFileIndex = indexSourceFiles(root)

    for (const sourceFile of Object.values(sourceFileIndex)) {
      const dependencies = paperwork(sourceFile.file.path, { includeCore: false, fileSystem: fs })
      for (const dependency of dependencies) {
        const resolvedDependency = resolveDependency(
          dependency,
          sourceFile.file.path,
          tsConfigs,
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
