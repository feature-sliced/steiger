import { describe, it, expect } from 'vitest'
import { joinFromRoot, parseIntoFolder } from '@steiger/toolkit/test'

import { prepareVfsForRuleRun } from './prepare-vfs-for-rule-run'
import { GlobGroupWithSeverity } from '../../models/config'

describe('prepareVfsForRuleRun', () => {
  it('should return vfs without off nodes', () => {
    const vfs = parseIntoFolder(
      `
      📂 shared
        📂 ui
          📄 Button.ts
          📄 Button.spec.ts
          📄 Input.ts
          📄 Input.spec.ts
          📄 index.ts
        📂 lib
          📄 get-query-params.ts
          📄 get-query-params.spec.ts
          📄 device-detection.ts
          📄 device-detection.spec.ts
          📄 index.ts
      📂 entities
        📂 user
          📂 ui
            📄 UserAvatar.ts
            📄 UserAvatar.spec.ts
          📄 Input.ts
      📂 pages
        📂 profile
          📄 index.ts
        📂 main
          📄 index.ts
    `,
      joinFromRoot('src'),
    )

    const expectedVfs = parseIntoFolder(
      `
      📂 shared
        📂 ui
          📄 Button.ts
          📄 Button.spec.ts
          📄 Input.ts
          📄 Input.spec.ts
          📄 index.ts
        📂 lib
          📄 get-query-params.ts
          📄 get-query-params.spec.ts
          📄 device-detection.ts
          📄 device-detection.spec.ts
          📄 index.ts
      📂 entities
        📂 user
          📂 ui
            📄 UserAvatar.ts
            📄 UserAvatar.spec.ts
          📄 Input.ts
    `,
      joinFromRoot('src'),
    )

    const globGroups = [
      {
        severity: 'error',
      },
      {
        files: ['/src/pages/**'],
        severity: 'off',
      },
      {
        files: ['**/ui/**'],
        severity: 'warn',
      },
    ] as Array<GlobGroupWithSeverity>

    expect(prepareVfsForRuleRun(vfs, globGroups)).toEqual(expectedVfs)
  })
})
