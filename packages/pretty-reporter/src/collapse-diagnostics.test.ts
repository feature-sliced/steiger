import { describe, expect, it } from 'vitest'
import { trimDiagnosticsToMeetQuota } from './collapse-diagnostics.js'

const defaultLocation = {
  path: '/users/user/file',
}

const defaultSeverity = 'error' as 'warn' | 'error'

describe('trimDiagnosticsToMeetQuota', () => {
  it('should return the same diagnostics if they are below the quota', () => {
    const diagnosticPerRule = [
      [
        {
          message: 'First rule, first message',
          ruleName: 'rule-1',
          location: defaultLocation,
          severity: defaultSeverity,
        },
        {
          message: 'First rule, second message',
          ruleName: 'rule-1',
          location: defaultLocation,
          severity: defaultSeverity,
        },
        {
          message: 'First rule, third message',
          ruleName: 'rule-1',
          location: defaultLocation,
          severity: defaultSeverity,
        },
      ],
      [
        {
          message: 'Second rule, first message',
          ruleName: 'rule-2',
          location: defaultLocation,
          severity: defaultSeverity,
        },
        {
          message: 'Second rule, second message',
          ruleName: 'rule-2',
          location: defaultLocation,
          severity: defaultSeverity,
        },
      ],
    ]

    const result = trimDiagnosticsToMeetQuota(diagnosticPerRule, 10)

    expect(result).toEqual(diagnosticPerRule)
  })

  it('should return no diagnostics if the quota is 0', () => {
    const diagnosticPerRule = [
      [
        {
          message: 'First rule, first message',
          ruleName: 'rule-1',
          location: defaultLocation,
          severity: defaultSeverity,
        },
        {
          message: 'First rule, second message',
          ruleName: 'rule-1',
          location: defaultLocation,
          severity: defaultSeverity,
        },
        {
          message: 'First rule, third message',
          ruleName: 'rule-1',
          location: defaultLocation,
          severity: defaultSeverity,
        },
      ],
      [
        {
          message: 'Second rule, first message',
          ruleName: 'rule-2',
          location: defaultLocation,
          severity: defaultSeverity,
        },
        {
          message: 'Second rule, second message',
          ruleName: 'rule-2',
          location: defaultLocation,
          severity: defaultSeverity,
        },
      ],
    ]

    const result = trimDiagnosticsToMeetQuota(diagnosticPerRule, 0)

    expect(result).toEqual([[], []])
  })

  it('should spread the quota evenly between rules', () => {
    const diagnosticPerRule = [
      [
        {
          message: 'First rule, first message',
          ruleName: 'rule-1',
          location: defaultLocation,
          severity: defaultSeverity,
        },
        {
          message: 'First rule, second message',
          ruleName: 'rule-1',
          location: defaultLocation,
          severity: defaultSeverity,
        },
        {
          message: 'First rule, third message',
          ruleName: 'rule-1',
          location: defaultLocation,
          severity: defaultSeverity,
        },
      ],
      [
        {
          message: 'Second rule, first message',
          ruleName: 'rule-2',
          location: defaultLocation,
          severity: defaultSeverity,
        },
        {
          message: 'Second rule, second message',
          ruleName: 'rule-2',
          location: defaultLocation,
          severity: defaultSeverity,
        },
      ],
    ]

    const result = trimDiagnosticsToMeetQuota(diagnosticPerRule, 2)

    expect(result).toEqual([
      [
        {
          message: 'First rule, first message',
          ruleName: 'rule-1',
          location: defaultLocation,
          severity: defaultSeverity,
        },
      ],
      [
        {
          message: 'Second rule, first message',
          ruleName: 'rule-2',
          location: defaultLocation,
          severity: defaultSeverity,
        },
      ],
    ])
  })

  it('should take first x rule diagnostics if the quota is less than the number of rules', () => {
    const diagnosticPerRule = [
      [
        {
          message: 'First rule, first message',
          ruleName: 'rule-1',
          location: defaultLocation,
          severity: defaultSeverity,
        },
        {
          message: 'First rule, second message',
          ruleName: 'rule-1',
          location: defaultLocation,
          severity: defaultSeverity,
        },
        {
          message: 'First rule, third message',
          ruleName: 'rule-1',
          location: defaultLocation,
          severity: defaultSeverity,
        },
      ],
      [
        {
          message: 'Second rule, first message',
          ruleName: 'rule-2',
          location: defaultLocation,
          severity: defaultSeverity,
        },
        {
          message: 'Second rule, second message',
          ruleName: 'rule-2',
          location: defaultLocation,
          severity: defaultSeverity,
        },
      ],
      [
        {
          message: 'Third rule, first message',
          ruleName: 'rule-3',
          location: defaultLocation,
          severity: defaultSeverity,
        },
        {
          message: 'Third rule, second message',
          ruleName: 'rule-3',
          location: defaultLocation,
          severity: defaultSeverity,
        },
      ],
      [
        {
          message: 'Forth rule, first message',
          ruleName: 'rule-4',
          location: defaultLocation,
          severity: defaultSeverity,
        },
        {
          message: 'Forth rule, second message',
          ruleName: 'rule-4',
          location: defaultLocation,
          severity: defaultSeverity,
        },
      ],
    ]

    const result = trimDiagnosticsToMeetQuota(diagnosticPerRule, 3)

    expect(result).toEqual([
      [
        {
          message: 'First rule, first message',
          ruleName: 'rule-1',
          location: defaultLocation,
          severity: defaultSeverity,
        },
      ],
      [
        {
          message: 'Second rule, first message',
          ruleName: 'rule-2',
          location: defaultLocation,
          severity: defaultSeverity,
        },
      ],
      [
        {
          message: 'Third rule, first message',
          ruleName: 'rule-3',
          location: defaultLocation,
          severity: defaultSeverity,
        },
      ],
      [],
    ])
  })
})
