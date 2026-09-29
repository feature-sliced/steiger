import { basename } from 'node:path'
import {
  conventionalSegmentNames,
  crossReferenceToken,
  getLayers,
  isSlice,
  isSliced,
  type LayerName,
} from '@feature-sliced/filesystem'
import type { Folder, PartialDiagnostic, Rule } from '@steiger/toolkit'
import { NAMESPACE } from '../constants.js'

/** Forbid files and segments placed directly inside a slice group. */
const noDirectCodeInSliceGroups = {
  name: `${NAMESPACE}/no-direct-code-in-slice-groups` as const,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []
    const sliceGroupShapeCache = new Map<Folder, boolean>()

    function visit(folder: Folder) {
      if (hasSliceGroupShape(folder, sliceGroupShapeCache)) {
        diagnostics.push(...checkSliceGroup(folder))

        for (const child of folder.children) {
          if (child.type === 'folder' && isSliceOrGroupCandidate(child)) {
            visit(child)
          }
        }
      } else if (!isSlice(folder)) {
        // Neither a slice nor a confirmed slice group, so there might be slice groups further down,
        // the same way `getSlices` keeps looking inside folders that aren't slices
        for (const child of folder.children) {
          if (child.type === 'folder') {
            visit(child)
          }
        }
      }
    }

    for (const [layerName, layer] of Object.entries(getLayers(root))) {
      // `isSliced` gets the layer name because, given the folder, it reads the raw folder name and would treat `6_shared` as sliced
      if (!isSliced(layerName as LayerName)) {
        continue
      }

      for (const child of layer.children) {
        // Segment folders directly on a layer are reported by `no-segments-on-sliced-layers` instead
        if (child.type === 'folder' && isSliceOrGroupCandidate(child)) {
          visit(child)
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default noDirectCodeInSliceGroups

/**
 * Report the direct children of a slice group that can't be slices: files, conventional segments, and cross-import public APIs.
 *
 * Folders with other names are left alone, because they could be slices without conventional segments.
 */
function checkSliceGroup(group: Folder): Array<PartialDiagnostic> {
  const diagnostics: Array<PartialDiagnostic> = []
  const groupName = basename(group.path)

  for (const child of group.children) {
    const childName = basename(child.path)

    if (child.type === 'file') {
      diagnostics.push({
        message: `Files should not be placed directly inside the slice group "${groupName}". Move this file into a slice.`,
        location: { path: child.path },
      })
    } else if (conventionalSegmentNames.includes(childName)) {
      diagnostics.push({
        message: `Conventional segment "${childName}" should not be placed directly inside the slice group "${groupName}". Move this segment into a slice.`,
        location: { path: child.path },
      })
    } else if (childName === crossReferenceToken) {
      diagnostics.push({
        message: `Cross-import public API "${crossReferenceToken}" should not be placed directly inside the slice group "${groupName}". Move it into the slice it belongs to.`,
        location: { path: child.path },
      })
    }
  }

  return diagnostics
}

/**
 * A folder looks like a slice group when at least two direct subfolders look like slices or slice groups.
 *
 * One is not enough: a slice with a custom segment that has a `ui` folder inside
 * looks exactly like a slice group with one slice.
 */
function hasSliceGroupShape(folder: Folder, cache: Map<Folder, boolean>): boolean {
  const cached = cache.get(folder)
  if (cached !== undefined) {
    return cached
  }

  const sliceLikeChildren = folder.children.filter(
    (child) =>
      child.type === 'folder' &&
      isSliceOrGroupCandidate(child) &&
      (hasSliceShape(child) || hasSliceGroupShape(child, cache)),
  )

  const result = sliceLikeChildren.length >= 2
  cache.set(folder, result)
  return result
}

/**
 * Stricter than `isSlice`: only conventional segment folders count,
 * not files such as `config.ts`, which custom segments often contain too.
 */
function hasSliceShape(folder: Folder): boolean {
  return folder.children.some(
    (child) => child.type === 'folder' && conventionalSegmentNames.includes(basename(child.path)),
  )
}

/** Folders named like segments or `@x` are never slices or slice groups. */
function isSliceOrGroupCandidate(folder: Folder): boolean {
  const name = basename(folder.path)
  return !conventionalSegmentNames.includes(name) && name !== crossReferenceToken
}
