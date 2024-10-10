import * as fs from 'node:fs'
import precinct from 'precinct'
const { paperwork } = precinct
import { parse as parseNearestTsConfig } from 'tsconfck'
import { getIndex, getLayers, getSegments, isSliced, resolveImport } from '@feature-sliced/filesystem'
import type { Folder, File, PartialDiagnostic, Rule } from '@steiger/types'

import { indexSourceFiles } from '../_lib/index-source-files.js'
import { NAMESPACE } from '../constants.js'

/** Restrict imports that go inside the slice, sidestepping the public API. */
const noPublicApiSidestep = {
  name: `${NAMESPACE}/no-public-api-sidestep`,
  async check(root) {
    const diagnostics: Array<PartialDiagnostic> = []
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

        // This rule only concerns imports from other slices
        if (
          sourceFile.layerName === dependencyLocation.layerName &&
          (!isSliced(dependencyLocation.layerName) || sourceFile.sliceName === dependencyLocation.sliceName)
        ) {
          continue
        }

        if (isSliced(dependencyLocation.layerName)) {
          if (dependencyLocation.segmentName !== null && dependencyLocation.segmentName !== '@x') {
            diagnostics.push({
              message: `Forbidden sidestep of public API when importing from "${dependency}".`,
              location: { path: sourceFile.file.path },
            })
          }
        } else if (dependencyLocation.segmentName !== null) {
          const layer = getLayers(root)[dependencyLocation.layerName]
          if (layer === undefined) {
            continue
          }

          const segment = getSegments(layer)[dependencyLocation.segmentName] as Folder | File | undefined
          if (segment === undefined) {
            continue
          }

          const index = getIndex(segment)
          if (resolvedDependency !== index?.path) {
            diagnostics.push({
              message: `Forbidden sidestep of public API when importing from "${dependency}".`,
              location: { path: sourceFile.file.path },
            })
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default noPublicApiSidestep
