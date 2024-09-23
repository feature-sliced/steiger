import { BaseRuleOptions, ConfigObject, GlobalIgnore, Plugin, PublicSeverity } from '@steiger/types'

export function getSeverity(severityOrTuple: PublicSeverity | [PublicSeverity, BaseRuleOptions]): PublicSeverity {
  return Array.isArray(severityOrTuple) ? severityOrTuple[0] : severityOrTuple
}

export function getOptions(
  severityOrTuple: PublicSeverity | [PublicSeverity, BaseRuleOptions],
): BaseRuleOptions | null {
  return Array.isArray(severityOrTuple) ? severityOrTuple[1] : null
}

export function isGlobalIgnore(obj: unknown): obj is GlobalIgnore {
  return typeof obj === 'object' && obj !== null && 'ignores' in obj && Object.keys(obj).length === 1
}

export function isConfigObject(obj: unknown): obj is ConfigObject {
  return typeof obj === 'object' && obj !== null && 'rules' in obj
}

export function isPlugin(obj: unknown): obj is Plugin {
  return typeof obj === 'object' && obj !== null && 'ruleDefinitions' in obj
}

export function isConfiguration(obj: unknown): obj is ConfigObject | GlobalIgnore {
  return isConfigObject(obj) || isGlobalIgnore(obj)
}
