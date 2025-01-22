import { describe, expect, it } from 'vitest'
import { Diagnostic } from '@steiger/types'

import { collapseDiagnostics } from './collapse-diagnostics.js'

function makeDummyDiagnostic(rule: string, messageNum: number, severity?: 'warn' | 'error'): Diagnostic {
  const defaultLocation = {
    path: '/users/user/file',
  }
  const defaultSeverity = 'error' as 'warn' | 'error'

  return {
    message: `${rule}, message ${messageNum}`,
    ruleName: rule,
    location: defaultLocation,
    severity: severity ?? defaultSeverity,
  }
}

describe('trimDiagnosticsToMeetQuota', () => {
  it('should return the same diagnostics if they are below the quota', () => {
    const diagnosticPerRule = [
      new Array(3).fill(0).map((_, i) => makeDummyDiagnostic('rule-1', i + 1)),
      new Array(2).fill(0).map((_, i) => makeDummyDiagnostic('rule-2', i + 1)),
    ]

    const result = collapseDiagnostics(diagnosticPerRule)

    expect(result).toEqual(diagnosticPerRule)
  })

  it('should spread the quota evenly between rules', () => {
    const diagnosticPerRule = [
      new Array(20).fill(0).map((_, i) => makeDummyDiagnostic('rule-1', i + 1)),
      new Array(20).fill(0).map((_, i) => makeDummyDiagnostic('rule-2', i + 1)),
    ]

    const result = collapseDiagnostics(diagnosticPerRule)

    expect(result).toEqual([diagnosticPerRule[0].slice(0, 10), diagnosticPerRule[1].slice(0, 10)])
  })

  it('should take first x rule diagnostics if the quota is less than the number of rules', () => {
    const diagnosticPerRule = [
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-1', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-2', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-3', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-4', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-5', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-6', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-7', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-8', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-9', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-10', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-11', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-12', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-13', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-14', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-15', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-16', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-17', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-18', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-19', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-20', i + 1)),
      new Array(1).fill(0).map((_, i) => makeDummyDiagnostic('rule-21', i + 1)),
    ]

    const result = collapseDiagnostics(diagnosticPerRule)

    expect(result).toEqual([...diagnosticPerRule.slice(0, 20), []])
  })

  it('should take errors first, then warnings', () => {
    const diagnosticPerRule = [
      new Array(10).fill(0).map((_, i) => makeDummyDiagnostic('rule-1', i + 1, i < 5 ? 'warn' : 'error')),
      new Array(20).fill(0).map((_, i) => makeDummyDiagnostic('rule-2', i + 1, i >= 10 ? 'warn' : 'error')),
      new Array(10).fill(0).map((_, i) => makeDummyDiagnostic('rule-3', i + 1, i < 5 ? 'warn' : 'error')),
    ]

    const result = collapseDiagnostics(diagnosticPerRule)

    expect(result).toEqual([
      // errors items first, then warnings
      [...diagnosticPerRule[0].slice(5), ...diagnosticPerRule[0].slice(0, 2)],
      [...diagnosticPerRule[1].slice(0, 7)],
      // error items first, then warnings
      [...diagnosticPerRule[2].slice(5), ...diagnosticPerRule[2].slice(0, 1)],
    ])
  })
})
