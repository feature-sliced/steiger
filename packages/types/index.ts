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

export interface Rule<
  Context = unknown,
  RuleOptions extends BaseRuleOptions = BaseRuleOptions,
  RuleName extends string | number | symbol = string,
> {
  /** Short code name for the rule. */
  name: RuleName
  check: (this: Context, root: Folder, ruleOptions: RuleOptions) => RuleResult | Promise<RuleResult>
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

export type Config<Rules extends Array<Rule>> = Array<ConfigObject<Rules> | Plugin<unknown, Rules> | GlobalIgnore>

export type Severity = 'off' | 'warn' | 'error'

/**
 * Extracts a union of rule names from a given tuple of `Rule` objects.
 *
 * @example
 * type Context = unknown
 * type Options = BaseRuleOptions
 * type Result = RuleNames<[Rule<Context, Options, 'foo'>, Rule<Context, Options, 'bar'>]>
 * // Result is 'foo' | 'bar'
 */
export type RuleNames<Rules extends Array<Rule>> = Rules[number]['name']

type LookUpByName<Union, Name> = Union extends { name: Name } ? Union : never

/**
 * Looks up a rule in a tuple of rules by name and then extracts that rule's options type.
 *
 * @example
 * type Context = unknown
 * type Rules = [Rule<Context, { foo: string }, 'foo'>, Rule<Context, { bar: number }, 'bar'>]
 * type Result = OptionsForRule<Rules, 'foo'>
 * // Result is { foo: string }
 */
export type OptionsForRule<Rules extends Array<Rule>, RuleName extends RuleNames<Rules>> =
  LookUpByName<Rules[number], RuleName> extends Rule<unknown, infer Options> ? Options : never

export interface ConfigObject<Rules extends Array<Rule>> {
  /** Globs of files to check. */
  files?: Array<string>
  /** Globs of files to ignore. */
  ignores?: Array<string>
  /** Severity of rules and individual rule options. */
  rules: { [key in RuleNames<Rules>]?: Severity | [Severity, OptionsForRule<Rules, key>] }
}

export type GlobalIgnore = { ignores: Array<string> }

export interface Plugin<Context = unknown, Rules extends Array<Rule<Context>> = Array<Rule>> {
  meta: {
    name: string
    version: string
  }
  ruleDefinitions: Rules
}
