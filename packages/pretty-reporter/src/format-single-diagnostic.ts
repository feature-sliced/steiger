import { relative } from 'node:path'
import figures from 'figures'
import terminalLink from 'terminal-link'
import pc from 'picocolors'
import type { Diagnostic } from '@steiger/types'

export function formatSingleDiagnostic(d: Diagnostic, cwd: string): string {
  const x = d.severity === 'error' ? pc.red(figures.cross) : pc.yellow(figures.warning)
  const s = pc.reset(figures.lineDownRight)
  const bar = pc.reset(figures.lineVertical)
  const e = pc.reset(figures.lineUpRight)
  const message = pc.reset(d.message)
  const autofixable = d.fixes !== undefined && d.fixes.length > 0 ? pc.green(`${figures.tick} Auto-fixable`) : null
  const location = pc.underline(formatLocation(d.location, cwd))
  const ruleName = pc.blue(terminalLink(d.ruleName, d.getRuleDescriptionUrl(d.ruleName).toString()))

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
