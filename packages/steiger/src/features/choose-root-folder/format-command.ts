import pc from 'picocolors'

export function formatCommand(command: string): string {
  return pc.green(`\`${command}\``)
}
