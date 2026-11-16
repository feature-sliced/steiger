import { join, parse, sep } from 'node:path'
import {
  crossReferenceToken,
  isCrossImportPublicApi as isCrossImportPublicApiFromFilesystem,
  isIndex,
} from '@feature-sliced/filesystem'
import type { File } from '@steiger/toolkit'

type CrossImportLocation = {
  inSlice: string
  forSlice: string
  layerPath: string
}

export function isCrossImportPublicApi(file: File, location: CrossImportLocation): boolean {
  if (isCrossImportPublicApiFromFilesystem(file, location)) {
    return true
  }

  // The filesystem helper compares a file's basename with the full slice name,
  // so it misses grouped slices such as security-module/user.
  if (!location.forSlice.includes(sep) || isIndex(file)) {
    return false
  }

  const { dir, name } = parse(file.path)
  return join(dir, name) === join(location.layerPath, location.inSlice, crossReferenceToken, location.forSlice)
}
