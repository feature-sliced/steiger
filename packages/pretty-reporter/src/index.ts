import pc from 'picocolors'
import figures from 'figures'
import type { Diagnostic } from '@steiger/types'

import { formatSingleDiagnostic } from './format-single-diagnostic.js'
import { s } from './pluralization.js'

export function formatPretty(diagnostics: Array<Diagnostic>, cwd: string) {
  if (diagnostics.length === 0) {
    return pc.green(`${figures.tick} No problems found!`)
  }

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
  if (autofixable.length === diagnostics.length) {
    footer += ` (all can be fixed automatically with ${pc.bold(pc.green('--fix'))})`
  } else if (autofixable.length > 0) {
    footer += ` (${autofixable.length} can be fixed automatically with ${pc.bold(pc.green('--fix'))})`
  } else {
    footer += ' (none can be fixed automatically)'
  }

  return (
    '\n' +
    diagnostics.map((d) => formatSingleDiagnostic(d, cwd)).join('\n\n') +
    '\n\n' +
    // Due to formatting characters, it won't be exactly the size of the footer, that is okay
    pc.gray(figures.line.repeat(footer.length)) +
    '\n ' +
    footer +
    '\n'
  )
}

export function reportPretty(diagnostics: Array<Diagnostic>, cwd: string) {
  console.error(formatPretty(diagnostics, cwd))
}
