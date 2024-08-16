export interface File {
  type: 'file'
  path: string
}

export interface Folder {
  type: 'folder'
  path: string
  children: Array<File | Folder>
}

export interface Context {
  sourceFileExtension: 'js' | 'ts'
}

export interface Options {
  /** Overrides for layer names */
  layerNames: Record<string, string>
  additionalSegmentNames: Array<string>
}

export type RuleOptions = Record<string, unknown>

export interface Rule {
  /** Short code name for the rule. */
  name: string
  check: (
    this: Context | Rule,
    root: Folder,
    options?: Options,
    ruleOptions?: RuleOptions,
  ) => RuleResult | Promise<RuleResult>
}

export interface RuleResult {
  diagnostics: Array<Diagnostic>
}

export interface Diagnostic {
  message: string
  fixes?: Array<Fix>
  location: {
    /** Absolute path to a folder or a file that contains the issue. */
    path: string
    line?: number
    column?: number
  }
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

export type Config = Array<ConfigObject | Plugin>

export type Severity = 'off' | 'warn' | 'error'

export interface ConfigObject {
  /** Globs of files to check */
  files?: Array<string>
  /** Globs of files to ignore */
  ignores?: Array<string>
  /** Severity of rules and individual rule options. */
  rules?: {
    [ruleName: string]: Severity | [Severity, Record<string, unknown>]
  }
}

export interface Plugin {
  meta: {
    name: string
    version: string
  }
  ruleDefinitions: Array<Rule>
}
