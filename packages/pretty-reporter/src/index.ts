import chalk from 'chalk'
import figures from 'figures'
import type { AugmentedDiagnostic } from './types.js'

export function formatPretty(diagnostics: Array<AugmentedDiagnostic>) {
  if (diagnostics.length === 0) {
    return chalk.green(`${figures.tick} No problems found!`)
  }

  let footer = chalk.red.bold(`Found ${diagnostics.length} problem${diagnostics.length > 1 ? 's' : ''}`)

  const autofixable = diagnostics.filter((d) => (d.fixes?.length ?? 0) > 0)
  if (autofixable.length === diagnostics.length) {
    footer += ' (all can be fixed automatically)'
  } else if (autofixable.length > 0) {
    footer += ` (${autofixable.length} can be fixed automatically)`
  } else {
    footer += ' (none can be fixed automatically)'
  }

  return (
    '\n' +
    diagnostics
      .map((d) => {
        let message = ` ${chalk.red(figures.cross)} ${chalk.reset(d.message)}  ${chalk.gray(`// ${d.ruleName}`)}`

        if ((d.fixes?.length ?? 0) > 0) {
          message += chalk.green(`\n   (${figures.tick} auto-fix available)`)
        }

        return message
      })
      .join('\n\n') +
    '\n\n' +
    chalk.gray(figures.line.repeat(footer.length)) +
    '\n ' +
    footer +
    '\n'
  )
}

export function reportPretty(diagnostics: Array<AugmentedDiagnostic>) {
  console.error(formatPretty(diagnostics))
}

export type { AugmentedDiagnostic }
