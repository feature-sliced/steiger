// Code adapted from the `which-pm-runs` package
// Source: https://github.com/zkochan/packages/tree/main/which-pm-runs, licensed under MIT

import type { PackageManager } from './package-managers'

/** Returns the package manager from the `npm_config_user_agent` env variable. */
export function whichPackageManagerRuns(): { name: PackageManager; version: string } | undefined {
  if (!process.env.npm_config_user_agent) {
    return undefined
  }
  const parsed = pmFromUserAgent(process.env.npm_config_user_agent)
  if (['npm', 'yarn', 'pnpm', 'bun', 'cnpm'].includes(parsed.name)) {
    return { name: parsed.name as PackageManager, version: parsed.version }
  } else {
    return undefined
  }
}

function pmFromUserAgent(userAgent: string) {
  const pmSpec = userAgent.split(' ')[0]
  const separatorPos = pmSpec.lastIndexOf('/')
  const name = pmSpec.substring(0, separatorPos)
  return {
    name: name === 'npminstall' ? 'cnpm' : name,
    version: pmSpec.substring(separatorPos + 1),
  }
}
