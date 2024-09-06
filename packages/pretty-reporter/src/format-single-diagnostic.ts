import { relative } from 'node:path'
import figures from 'figures'
import terminalLink from 'terminal-link'
import chalk from 'chalk'

import type { FullDiagnostic } from './types.js'

export function formatSingleDiagnostic(d: FullDiagnostic, cwd: string): string {
  const x = d.severity === 'error' ? chalk.red(figures.cross) : chalk.yellow(figures.warning)
  const s = chalk.reset(figures.lineDownRight)
  const bar = chalk.reset(figures.lineVertical)
  const e = chalk.reset(figures.lineUpRight)
  const message = chalk.reset(d.message)
  const autofixable = d.fixes !== undefined && d.fixes.length > 0 ? chalk.green(`${figures.tick} Auto-fixable`) : null
  const location = chalk.gray(formatLocation(d.location, cwd))
  const ruleName = chalk.blue(terminalLink(d.ruleName, d.ruleDescriptionUrl))

  return `
${s} ${location}
${x} ${message}
${autofixable ? autofixable + `\n${bar}` : bar}
${e} ${ruleName}
`.trim()
}

function formatLocation(location: FullDiagnostic['location'], cwd: string) {
  let path = relative(cwd, location.path)
  if (location.line !== undefined) {
    path += `:${location.line}`

    if (location.column !== undefined) {
      path += `:${location.column}`
    }
  }

  return path
}
