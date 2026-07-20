import * as fs from 'node:fs'
import { parse as parseNearestTsConfig } from 'tsconfck'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'

import { indexSourceFiles } from '../_lib/index-source-files.js'
import { collectRelatedTsConfigs } from '../_lib/collect-related-ts-configs.js'
import { resolveDependency } from '../_lib/resolve-dependency.js'
import { NAMESPACE } from '../constants.js'
import { extractDependencies, getSourceType } from '../_language-tools/index.js'
import type { FsdRuleOptions } from '../fsd-options.js'

const importLocality = {
  name: `${NAMESPACE}/import-locality`,
  async check(root, ruleOptions: FsdRuleOptions = {}) {
    const diagnostics: Array<PartialDiagnostic> = []
    const parseResult = await parseNearestTsConfig(root.children[0]?.path ?? root.path)
    const tsConfigs = collectRelatedTsConfigs(parseResult)
    const sourceFileIndex = indexSourceFiles(root, ruleOptions.layerConvention)

    for (const sourceFile of Object.values(sourceFileIndex)) {
      const sourceType = getSourceType(sourceFile.file.path)
      if (!sourceType) continue

      const dependencies = await extractDependencies(sourceFile.file.path)
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
} satisfies Rule<unknown, FsdRuleOptions>

export default importLocality
