import { flattenFolder, copyFsEntity } from '../../../shared/file-system'
import { Folder, File } from '@steiger/types'

export default function createVfsForRules(rules: Array<string>, vfs: Folder): Record<string, Array<File>> {
  const flatVfs = flattenFolder(vfs)
  const ruleToVfs: Record<string, Array<File>> = {}

  flatVfs.forEach((entity) => {
    rules.forEach((rule) => {
      if (!ruleToVfs[rule]) {
        ruleToVfs[rule] = []
      }

      ruleToVfs[rule].push(copyFsEntity(entity))
    })
  })

  return ruleToVfs
}
