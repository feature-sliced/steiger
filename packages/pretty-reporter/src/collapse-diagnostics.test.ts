import { describe, expect, it } from 'vitest'
import { trimDiagnosticsToMeetQuota } from './collapse-diagnostics.js'

const defaultLocation = {
  path: '/users/user/file',
}

const defaultSeverity = 'error' as 'warn' | 'error'

// dummy rules

const rule1Message1 = {
  message: 'First rule, first message',
  ruleName: 'rule-1',
  location: defaultLocation,
  severity: defaultSeverity,
}

const rule1Message2 = {
  message: 'First rule, second message',
  ruleName: 'rule-1',
  location: defaultLocation,
  severity: defaultSeverity,
}

const rule1Message3 = {
  message: 'First rule, third message',
  ruleName: 'rule-1',
  location: defaultLocation,
  severity: defaultSeverity,
}

const rule2Message1 = {
  message: 'Second rule, first message',
  ruleName: 'rule-2',
  location: defaultLocation,
  severity: defaultSeverity,
}

const rule2Message2 = {
  message: 'Second rule, second message',
  ruleName: 'rule-2',
  location: defaultLocation,
  severity: defaultSeverity,
}

const rule3Message1 = {
  message: 'Third rule, first message',
  ruleName: 'rule-3',
  location: defaultLocation,
  severity: defaultSeverity,
}

const rule3Message2 = {
  message: 'Third rule, second message',
  ruleName: 'rule-3',
  location: defaultLocation,
  severity: defaultSeverity,
}

const rule4Message1 = {
  message: 'Forth rule, first message',
  ruleName: 'rule-4',
  location: defaultLocation,
  severity: defaultSeverity,
}

const rule4Message2 = {
  message: 'Forth rule, second message',
  ruleName: 'rule-4',
  location: defaultLocation,
  severity: defaultSeverity,
}

describe('trimDiagnosticsToMeetQuota', () => {
  it('should return the same diagnostics if they are below the quota', () => {
    const diagnosticPerRule = [
      [rule1Message1, rule1Message2, rule1Message3],
      [rule2Message1, rule2Message2],
    ]

    const result = trimDiagnosticsToMeetQuota(diagnosticPerRule, 10)

    expect(result).toEqual(diagnosticPerRule)
  })

  it('should return no diagnostics if the quota is 0', () => {
    const diagnosticPerRule = [
      [rule1Message1, rule1Message2, rule1Message3],
      [rule2Message1, rule2Message2],
    ]

    const result = trimDiagnosticsToMeetQuota(diagnosticPerRule, 0)

    expect(result).toEqual([[], []])
  })

  it('should spread the quota evenly between rules', () => {
    const diagnosticPerRule = [
      [rule1Message1, rule1Message2, rule1Message3],
      [rule2Message1, rule2Message2],
    ]

    const result = trimDiagnosticsToMeetQuota(diagnosticPerRule, 2)

    expect(result).toEqual([[rule1Message1], [rule2Message1]])
  })

  it('should take first x rule diagnostics if the quota is less than the number of rules', () => {
    const diagnosticPerRule = [
      [rule1Message1, rule1Message2, rule1Message3],
      [rule2Message1, rule2Message2],
      [rule3Message1, rule3Message2],
      [rule4Message1, rule4Message2],
    ]

    const result = trimDiagnosticsToMeetQuota(diagnosticPerRule, 3)

    expect(result).toEqual([[rule1Message1], [rule2Message1], [rule3Message1]])
  })

  it('should not distribute the quota to non-existent items', () => {
    const diagnostics = [[rule1Message1, rule1Message2, rule1Message3], [rule2Message1, rule2Message2], [rule3Message1]]

    expect(trimDiagnosticsToMeetQuota(diagnostics, 6)).toEqual([
      [rule1Message1, rule1Message2, rule1Message3],
      [rule2Message1, rule2Message2],
      [rule3Message1],
    ])
  })

  it('should correctly stop distributing quota if the quota is greater than the number of diagnostics', () => {
    const diagnostics = [[rule1Message1, rule1Message2, rule1Message3], [rule2Message1, rule2Message2], [rule3Message1]]

    expect(trimDiagnosticsToMeetQuota(diagnostics, 10)).toEqual([
      [rule1Message1, rule1Message2, rule1Message3],
      [rule2Message1, rule2Message2],
      [rule3Message1],
    ])
  })
})
