import { describe, it, expect } from 'vitest'

import { joinFromRoot, parseIntoFsdRoot } from '../../_lib/prepare-test'
import markDefault from './mark-default'
import { SeverityMarkedFolder } from './types'

describe('markDefault', () => {
  it('should mark all nodes with default severity', () => {
    const vfs = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 Button.ts
          📄 Input.ts
          📄 index.ts
        📄 index.ts
    `,
      joinFromRoot('src'),
    )

    expect(markDefault(vfs as SeverityMarkedFolder)).toEqual({
      type: 'folder',
      path: joinFromRoot('src'),
      severity: 'off',
      children: [
        {
          type: 'folder',
          path: joinFromRoot('src', 'shared'),
          severity: 'off',
          children: [
            {
              type: 'folder',
              path: joinFromRoot('src', 'shared', 'ui'),
              severity: 'off',
              children: [
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'Button.ts'),
                  severity: 'off',
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'Input.ts'),
                  severity: 'off',
                },
                {
                  type: 'file',
                  path: joinFromRoot('src', 'shared', 'ui', 'index.ts'),
                  severity: 'off',
                },
              ],
            },
            {
              type: 'file',
              path: joinFromRoot('src', 'shared', 'index.ts'),
              severity: 'off',
            },
          ],
        },
      ],
    })
  })
})
