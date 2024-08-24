import { Severity, File, Folder, BaseRuleOptions } from '@steiger/types'

/**
 * This interface represents the environment that keeps everything
 * that a rule needs to run and what is needed to process the diagnostics.
 * */
export interface RuleRunEnvironment {
  /** A map of a file path to severity applied to it.
   * Useful when deciding what to do with the diagnostics (how to report them, error vs warning)
   * */
  severityMap: Record<string, Exclude<Severity, 'off'>>
  /** The final VFS that the rule needs to analyze.
   * May be null if all files had 'off' severity after applying globs.
   * Then it means that the rule should not run.
   * */
  vfs: Folder | null
  /** Options for the rule brought from the config. */
  ruleOptions: BaseRuleOptions
}

export interface SeverityMarkedFile extends File {
  severity: Severity
}

export interface SeverityMarkedFolder extends Folder {
  severity: Severity
}

interface GlobGroup {
  severity: Severity
  files: Array<string>
  ignores: Array<string>
}

export interface RuleInstructions {
  options: BaseRuleOptions | null
  globGroups: Array<GlobGroup>
}
