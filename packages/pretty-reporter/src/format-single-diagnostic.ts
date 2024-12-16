import { relative } from 'node:path'
import figures from 'figures'
import terminalLink from 'terminal-link'
import picocolors from 'picocolors'
import type { Diagnostic } from '@steiger/types'

export function formatSingleDiagnostic(d: Diagnostic, cwd: string): string {
  const x = d.severity === 'error' ? picocolors.red(figures.cross) : picocolors.yellow(figures.warning)
  const s = picocolors.reset(figures.lineDownRight)
  const bar = picocolors.reset(figures.lineVertical)
  const e = picocolors.reset(figures.lineUpRight)
  const message = picocolors.reset(d.message)
  const autofixable =
    d.fixes !== undefined && d.fixes.length > 0 ? picocolors.green(`${figures.tick} Auto-fixable`) : null
  const location = picocolors.dim(formatLocation(d.location, cwd))
  const ruleName = picocolors.blue(terminalLink(d.ruleName, d.getRuleDescriptionUrl(d.ruleName).toString()))

  return `
${s} ${location}
${x} ${message}
${autofixable ? autofixable + `\n${bar}` : bar}
${e} ${ruleName}
`.trim()
}

function formatLocation(location: Diagnostic['location'], cwd: string) {
  let path = relative(cwd, location.path)
  if (location.line !== undefined) {
    path += `:${location.line}`

    if (location.column !== undefined) {
      path += `:${location.column}`
    }
  }

  return path
}
