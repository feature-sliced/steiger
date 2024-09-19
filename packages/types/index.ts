export interface File {
  type: 'file'
  path: string
}

export interface Folder {
  type: 'folder'
  path: string
  children: Array<File | Folder>
}

export type BaseRuleOptions = Record<string, unknown>

export interface Rule<Context = void, RuleOptions = BaseRuleOptions> {
  /** Short code name for the rule. */
  name: string
  check: (this: Context, root: Folder, ruleOptions?: RuleOptions) => RuleResult | Promise<RuleResult>
}

export interface RuleResult {
  diagnostics: Array<PartialDiagnostic>
}

export interface PartialDiagnostic {
  message: string
  fixes?: Array<Fix>
  location: {
    /** Absolute path to a folder or a file that contains the issue. */
    path: string
    line?: number
    column?: number
  }
}

export interface Diagnostic extends PartialDiagnostic {
  ruleName: string
  severity: Exclude<Severity, 'off'>
  getRuleDescriptionUrl(ruleName: string): URL
}

export type Fix =
  | {
      type: 'rename'
      path: string
      newName: string
    }
  | {
      type: 'create-file'
      path: string
      content: string
    }
  | {
      type: 'create-folder'
      path: string
    }
  | {
      type: 'delete'
      path: string
    }
  | {
      type: 'modify-file'
      path: string
      content: string
    }

export type Config = Array<ConfigObject | Plugin | GlobalIgnore>

export type Severity = 'off' | 'warn' | 'error'

export type ConfigObject = {
  /** Globs of files to check */
  files?: Array<string>
  /** Globs of files to ignore */
  ignores?: Array<string>
  /** Severity of rules and individual rule options. */
  rules: {
    [ruleName: string]: Severity | [Severity, BaseRuleOptions]
  }
}

export type GlobalIgnore = { ignores: Array<string> }

export interface Plugin {
  meta: {
    name: string
    version: string
  }
  ruleDefinitions: Array<Rule>
}
