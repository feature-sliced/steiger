import { styleText } from 'node:util'

export function formatCommand(command: string): string {
  return styleText('green', `\`${command}\``)
}
