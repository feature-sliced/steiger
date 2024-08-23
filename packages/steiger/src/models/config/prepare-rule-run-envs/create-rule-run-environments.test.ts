import { describe, expect, it } from 'vitest'
import createRuleRunEnvironments from './create-rule-run-environments'
import { SeverityMarkedFile } from '../types'
import { Folder } from '@steiger/types'

describe('createRuleRunEnvironments', () => {
  it('should create rule run environments', () => {
    const ruleToMarkedVfs: Record<string, Array<SeverityMarkedFile>> = {
      rule1: [
        {
          type: 'file',
          path: '/src/shared/ui/index.ts',
          severity: 'warn',
        },
        {
          type: 'file',
          path: '/src/shared/ui/Button.tsx',
          severity: 'warn',
        },
        {
          type: 'file',
          path: '/src/entities/user/ui/UserAvatar.tsx',
          severity: 'off',
        },
        {
          type: 'file',
          path: '/src/entities/user/ui/index.ts',
          severity: 'off',
        },
      ],
      rule2: [
        {
          type: 'file',
          path: '/src/shared/ui/index.ts',
          severity: 'error',
        },
        {
          type: 'file',
          path: '/src/shared/ui/Button.tsx',
          severity: 'error',
        },
        {
          type: 'file',
          path: '/src/entities/user/ui/UserAvatar.tsx',
          severity: 'error',
        },
        {
          type: 'file',
          path: '/src/entities/user/ui/index.ts',
          severity: 'error',
        },
      ],
    }

    const ruleInstructions = {
      rule1: {
        options: {},
        globGroups: [],
      },
      rule2: {
        options: {
          option1: 'value1',
        },
        globGroups: [],
      },
    }

    const root: Folder = {
      type: 'folder',
      path: '/src',
      children: [],
    }

    const ruleRunEnvironments = createRuleRunEnvironments(ruleToMarkedVfs, ruleInstructions, root)

    expect(ruleRunEnvironments).toEqual({
      rule1: {
        severityMap: {
          '/src/shared/ui/index.ts': 'warn',
          '/src/shared/ui/Button.tsx': 'warn',
          '/src/entities/user/ui/UserAvatar.tsx': 'off',
          '/src/entities/user/ui/index.ts': 'off',
        },
        vfs: {
          type: 'folder',
          path: '/src',
          children: [
            {
              type: 'folder',
              path: '/src/shared',
              children: [
                {
                  type: 'folder',
                  path: '/src/shared/ui',
                  children: [
                    {
                      type: 'file',
                      path: '/src/shared/ui/index.ts',
                    },
                    {
                      type: 'file',
                      path: '/src/shared/ui/Button.tsx',
                    },
                  ],
                },
              ],
            },
          ],
        },
        ruleOptions: {},
      },
      rule2: {
        severityMap: {
          '/src/shared/ui/index.ts': 'error',
          '/src/shared/ui/Button.tsx': 'error',
          '/src/entities/user/ui/UserAvatar.tsx': 'error',
          '/src/entities/user/ui/index.ts': 'error',
        },
        vfs: {
          type: 'folder',
          path: '/src',
          children: [
            {
              type: 'folder',
              path: '/src/shared',
              children: [
                {
                  type: 'folder',
                  path: '/src/shared/ui',
                  children: [
                    {
                      type: 'file',
                      path: '/src/shared/ui/index.ts',
                    },
                    {
                      type: 'file',
                      path: '/src/shared/ui/Button.tsx',
                    },
                  ],
                },
              ],
            },
            {
              type: 'folder',
              path: '/src/entities',
              children: [
                {
                  type: 'folder',
                  path: '/src/entities/user',
                  children: [
                    {
                      type: 'folder',
                      path: '/src/entities/user/ui',
                      children: [
                        {
                          type: 'file',
                          path: '/src/entities/user/ui/UserAvatar.tsx',
                        },
                        {
                          type: 'file',
                          path: '/src/entities/user/ui/index.ts',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        ruleOptions: {
          option1: 'value1',
        },
      },
    })
  })

  it('should return null for vfs that has all files off', () => {
    const ruleToMarkedVfs: Record<string, Array<SeverityMarkedFile>> = {
      rule1: [
        {
          type: 'file',
          path: '/src/shared/ui/index.ts',
          severity: 'off',
        },
        {
          type: 'file',
          path: '/src/shared/ui/Button.tsx',
          severity: 'off',
        },
        {
          type: 'file',
          path: '/src/entities/user/ui/UserAvatar.tsx',
          severity: 'off',
        },
        {
          type: 'file',
          path: '/src/entities/user/ui/index.ts',
          severity: 'off',
        },
      ],
    }

    const ruleInstructions = {
      rule1: {
        options: {},
        globGroups: [],
      },
    }

    const root: Folder = {
      type: 'folder',
      path: '/src',
      children: [],
    }

    const ruleRunEnvironments = createRuleRunEnvironments(ruleToMarkedVfs, ruleInstructions, root)

    expect(ruleRunEnvironments).toEqual({
      rule1: {
        severityMap: {
          '/src/shared/ui/index.ts': 'off',
          '/src/shared/ui/Button.tsx': 'off',
          '/src/entities/user/ui/UserAvatar.tsx': 'off',
          '/src/entities/user/ui/index.ts': 'off',
        },
        vfs: null,
        ruleOptions: {},
      },
    })
  })
})
