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

export type Config = Array<ConfigObject<Array<Rule>> | Plugin>

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
  rules?: { [key in RuleNames<Rules>]?: Severity | [Severity, OptionsForRule<Rules, key>] }
}

export interface Plugin<Context = unknown, Rules extends Array<Rule<Context>> = Array<Rule>> {
  meta: {
    name: string
    version: string
  }
  ruleDefinitions: Rules
}

// TODO: this type should be owned by `pretty-reporter`, but for some reason
//   `tsup` refuses to inline the types from `pretty-reporter`, even though
//    it's perfectly capable of inlining types from `types`. Idk, I'll figure it out later.
export interface AugmentedDiagnostic extends Diagnostic {
  ruleName: string
  severity: Exclude<Severity, 'off'>
  getRuleDescriptionUrl(ruleName: string): URL
}
