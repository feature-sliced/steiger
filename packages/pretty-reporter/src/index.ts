import chalk from 'chalk'
import figures from 'figures'
import type { Diagnostic } from './types.js'

export function formatPretty(diagnostics: Array<Diagnostic>) {
  let footer = ''

  if (diagnostics.length > 0) {
    footer = chalk.red.bold(`Found ${diagnostics.length} problem${diagnostics.length > 1 ? 's' : ''}`)

    const autofixable = diagnostics.filter((d) => (d.fixes?.length ?? 0) > 0)
    if (autofixable.length === diagnostics.length) {
      footer += ' (all can be fixed automatically)'
    } else if (autofixable.length > 0) {
      footer += ` (${autofixable.length} can be fixed automatically)`
    } else {
      footer += ' (none can be fixed automatically)'
    }
  } else {
    footer = 'No problems found'
  }

  return (
    '\n' +
    diagnostics
      .map((d) => {
        let message = ` ${chalk.red(figures.cross)} ${chalk.black(d.message)}`

        if ((d.fixes?.length ?? 0) > 0) {
          message += chalk.gray(`\n   (${figures.tick} auto-fix available)`)
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

export function reportPretty(diagnostics: Array<Diagnostic>) {
  console.error(formatPretty(diagnostics))
}
