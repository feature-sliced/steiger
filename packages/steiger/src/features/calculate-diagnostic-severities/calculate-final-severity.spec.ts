import { describe, expect, it, vi } from 'vitest'
import { joinFromRoot, parseIntoFolder } from '@steiger/toolkit/test'

import calculateFinalSeverities from './calculate-final-severity'
import { GlobGroupWithSeverity } from '../../models/config'

vi.mock('../../models/config', async () => {
  const ruleToGlobs: Record<string, Array<GlobGroupWithSeverity>> = {
    rule1: [{ severity: 'warn' }, { files: ['/src/shared/ui/Button.ts'], severity: 'error' }],
  }

  return {
    getGlobsForRule: vi.fn((ruleName: string) => ruleToGlobs[ruleName]),
  }
})

describe('calculateFinalSeverity', () => {
  it('should return severities for paths', () => {
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

    const severities = calculateFinalSeverities(vfs, 'rule1', [
      joinFromRoot('src', 'shared', 'ui', 'Button.ts'),
      joinFromRoot('src', 'shared', 'ui'),
      joinFromRoot('src', 'shared'),
      joinFromRoot('src', 'lib'),
    ])

    expect(severities).toEqual(['error', 'error', 'error', 'warn'])
  })
})
