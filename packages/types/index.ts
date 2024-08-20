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

export interface Rule<Context = void, RuleOptions = BaseRuleOptions, Rules extends string = string> {
  /** Short code name for the rule. */
  name: Rules
  check: (this: Context, root: Folder, ruleOptions?: RuleOptions) => RuleResult | Promise<RuleResult>
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

export interface ConfigObject<Rules extends string = string> {
  /** Globs of files to check. */
  files?: Array<string>
  /** Globs of files to ignore. */
  ignores?: Array<string>
  /** Severity of rules and individual rule options. */
  rules?: Partial<Record<Rules, Severity | [Severity, BaseRuleOptions]>>
}

export interface Plugin<Rules extends string = string> {
  meta: {
    name: string
    version: string
  }
  ruleDefinitions: Array<Rule<unknown, BaseRuleOptions, Rules>>
}

// export interface Plugin<
//   Context = unknown,
//   Rules extends string = string,
//   RuleOptions extends Record<Rules, BaseRuleOptions> = Record<Rules, BaseRuleOptions>,
// > {
//   meta: {
//     name: string
//     version: string
//   }
//   // CONTINUE: figure out how to type each individual rule's options
//   ruleDefinitions: Array<Rule<Context, RuleOptions, Rules>>
// }
