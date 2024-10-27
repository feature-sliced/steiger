import * as fs from 'node:fs'
import { basename, relative, sep } from 'node:path'
import precinct from 'precinct'
const { paperwork } = precinct
import { parse as parseNearestTsConfig } from 'tsconfck'
import { getIndex, getLayers, getSegments, isSliced, crossReferenceToken } from '@feature-sliced/filesystem'
import type { Folder, File, PartialDiagnostic, Rule } from '@steiger/toolkit'

import { indexSourceFiles } from '../_lib/index-source-files.js'
import { collectRelatedTsConfigs } from '../_lib/collect-related-ts-configs.js'
import { resolveDependency } from '../_lib/resolve-dependency.js'
import { NAMESPACE } from '../constants.js'

/** Restrict imports that go inside the slice, sidestepping the public API. */
const noPublicApiSidestep = {
  name: `${NAMESPACE}/no-public-api-sidestep` as const,
  async check(root) {
    const diagnostics: Array<PartialDiagnostic> = []
    const { tsconfig, referenced } = await parseNearestTsConfig(root.path)
    const tsConfigs = collectRelatedTsConfigs({ tsconfig, referenced })
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

        // This rule only concerns imports from other slices
        if (
          sourceFile.layerName === dependencyLocation.layerName &&
          (!isSliced(dependencyLocation.layerName) || sourceFile.sliceName === dependencyLocation.sliceName)
        ) {
          continue
        }

        if (isSliced(dependencyLocation.layerName)) {
          if (dependencyLocation.segmentName !== null && dependencyLocation.segmentName !== crossReferenceToken) {
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

          const segmentIndex = getIndex(segment)
          if (segment.type === 'folder' && resolvedDependency !== segmentIndex?.path) {
            if (dependencyLocation.layerName === 'shared' && ['ui', 'lib'].includes(dependencyLocation.segmentName)) {
              // Special case for shared/ui and shared/lib
              const pathInSegment = relative(segment.path, resolvedDependency)
              const topLevelFolder = segment.children.find(
                (child) => child.type === 'folder' && basename(child.path) === pathInSegment.split(sep)[0],
              ) as Folder | undefined

              if (topLevelFolder !== undefined) {
                const topLevelFolderIndex = getIndex(topLevelFolder)
                if (resolvedDependency !== topLevelFolderIndex?.path) {
                  diagnostics.push({
                    message: `Forbidden sidestep of public API when importing from "${dependency}".`,
                    location: { path: sourceFile.file.path },
                  })
                }
              }
            } else {
              diagnostics.push({
                message: `Forbidden sidestep of public API when importing from "${dependency}".`,
                location: { path: sourceFile.file.path },
              })
            }
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default noPublicApiSidestep
