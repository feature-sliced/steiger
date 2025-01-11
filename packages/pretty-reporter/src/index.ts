import pc from 'picocolors'
import figures from 'figures'
import type { Diagnostic } from '@steiger/types'

import { formatSingleDiagnostic } from './format-single-diagnostic.js'
import { collapseDiagnostics } from './collapse-diagnostics.js'
import { groupDiagnosticsByRule } from './group-diagnostics-by-rule.js'
import { s } from './pluralization.js'

export function formatPretty(diagnostics: Array<Diagnostic>, cwd: string) {
  if (diagnostics.length === 0) {
    return pc.green(`${figures.tick} No problems found!`)
  }

  const collapsedDiagnostics = collapseDiagnostics(groupDiagnosticsByRule(diagnostics)).flat()
  const collapsedDiagnosticsCount = collapsedDiagnostics.length
  const initialDiagnosticsCount = diagnostics.length

  const errors = diagnostics.filter((d) => d.severity === 'error')
  const warnings = diagnostics.filter((d) => d.severity === 'warn')

  let footer =
    'Found ' +
    [
      errors.length > 0 && pc.bold(pc.red(`${errors.length} error${s(errors.length)}`)),
      warnings.length > 0 && pc.bold(pc.yellow(`${warnings.length} warning${s(warnings.length)}`)),
    ]
      .filter(Boolean)
      .join(' and ')

  const autofixable = diagnostics.filter((d) => (d.fixes?.length ?? 0) > 0)
  if (autofixable.length === initialDiagnosticsCount) {
    footer += ` (all can be fixed automatically with ${pc.bold(pc.green('--fix'))})`
  } else if (autofixable.length > 0) {
    footer += ` (${autofixable.length} can be fixed automatically with ${pc.bold(pc.green('--fix'))})`
  } else {
    footer += ' (none can be fixed automatically)'
  }

  return (
    '\n' +
    collapsedDiagnostics.map((d) => formatSingleDiagnostic(d, cwd)).join('\n\n') +
    '\n\n' +
    // Due to formatting characters, it won't be exactly the size of the footer, that is okay
    pc.gray(figures.line.repeat(footer.length)) +
    '\n ' +
    footer +
    '\n ' +
    (collapsedDiagnosticsCount < initialDiagnosticsCount
      ? `${pc.reset(initialDiagnosticsCount - collapsedDiagnosticsCount)} diagnostics are not shown in the report as they exceed the limit allowed by Steiger`
      : '')
  )
}

export function reportPretty(diagnostics: Array<Diagnostic>, cwd: string) {
  console.error(formatPretty(diagnostics, cwd))
}
