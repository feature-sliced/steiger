import { Diagnostic } from '@steiger/types'

export function groupDiagnosticsByRule(diagnostics: Diagnostic[]): Diagnostic[][] {
  const grouped: Record<string, Diagnostic[]> = {}

  diagnostics.forEach((diagnostic) => {
    if (!grouped[diagnostic.ruleName]) {
      grouped[diagnostic.ruleName] = []
    }
    grouped[diagnostic.ruleName].push(diagnostic)
  })

  return Object.values(grouped)
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest

  describe('groupDiagnosticsByRule', () => {
    it('should group diagnostics by ruleName', () => {
      const diagnostics: Diagnostic[] = [
        {
          ruleName: 'rule-1',
          severity: 'error',
          location: { path: '/users/user/project/src/app/index.ts' },
          message: 'First rule, first message',
        },
        {
          ruleName: 'rule-2',
          severity: 'warn',
          location: { path: '/users/user/project/src/app/index.ts' },
          message: 'Second rule, first message',
        },
        {
          ruleName: 'rule-1',
          severity: 'warn',
          location: { path: '/users/user/project/src/app/index.ts' },
          message: 'First rule, second message',
        },
      ]

      const result = groupDiagnosticsByRule(diagnostics)

      expect(result).toHaveLength(2)
      expect(result).toContainEqual([
        {
          ruleName: 'rule-1',
          severity: 'error',
          location: { path: '/users/user/project/src/app/index.ts' },
          message: 'First rule, first message',
        },
        {
          ruleName: 'rule-1',
          severity: 'warn',
          location: { path: '/users/user/project/src/app/index.ts' },
          message: 'First rule, second message',
        },
      ])
      expect(result).toContainEqual([
        {
          ruleName: 'rule-2',
          severity: 'warn',
          location: { path: '/users/user/project/src/app/index.ts' },
          message: 'Second rule, first message',
        },
      ])
    })

    it('should return an empty array when no diagnostics are provided', () => {
      const result = groupDiagnosticsByRule([])
      expect(result).toEqual([])
    })
  })
}
