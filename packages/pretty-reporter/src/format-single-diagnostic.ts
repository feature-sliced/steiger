import { relative } from 'node:path'
import { styleText } from 'node:util'
import figures from 'figures'
import terminalLink from 'terminal-link'
import type { Diagnostic } from '@steiger/types'

export function formatSingleDiagnostic(d: Diagnostic, cwd: string): string {
  const x = styleText(
    d.severity === 'error' ? 'red' : 'yellow',
    d.severity === 'error' ? figures.cross : figures.warning,
    {
      stream: process.stderr,
    },
  )
  const s = styleText('reset', figures.lineDownRight, { stream: process.stderr })
  const bar = styleText('reset', figures.lineVertical, { stream: process.stderr })
  const e = styleText('reset', figures.lineUpRight, { stream: process.stderr })
  const message = styleText('reset', d.message, { stream: process.stderr })
  const autofixable =
    d.fixes !== undefined && d.fixes.length > 0
      ? styleText('green', `${figures.tick} Auto-fixable`, { stream: process.stderr })
      : null
  const location = styleText('underline', formatLocation(d.location, cwd), { stream: process.stderr })
  const ruleName = styleText(
    'blue',
    terminalLink(d.ruleName, d.getRuleDescriptionUrl(d.ruleName).toString(), {
      fallback: (text, url) =>
        `${styleText('reset', text, { stream: process.stderr })}: ${styleText('blue', url, { stream: process.stderr })}`,
    }),
    { stream: process.stderr },
  )

  return `
${s} ${location}
${x} ${message}
${autofixable ? autofixable + `\n${bar}` : bar}
${e} ${ruleName}
`.trim()
}

function formatLocation(location: Diagnostic['location'], cwd: string) {
  let path = relative(cwd, location.path)
  const start = location.start
  if (start?.line !== undefined) {
    path += `:${start.line}`

    if (start.column !== undefined) {
      path += `:${start.column}`
    }
  }

  return path
}
