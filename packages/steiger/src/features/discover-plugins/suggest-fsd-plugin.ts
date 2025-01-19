import { basename, dirname, relative, resolve } from 'node:path'
import { access } from 'node:fs/promises'
import { confirm, isCancel, outro, log, tasks } from '@clack/prompts'
import * as pkg from 'empathic/package'
import pc from 'picocolors'
import { exec, type Output } from 'tinyexec'
import terminalLink from 'terminal-link'

import { whichLockfileExists, whichPackageManagerRuns } from '../../shared/package-manager'
import { ExitException } from '../../shared/exit-exception'
import { pluginNamePrefix } from './is-steiger-plugin'

const fsdPlugin = '@feature-sliced/steiger-plugin'
const fsdWebsiteLink = terminalLink('Feature-Sliced Design', 'https://feature-sliced.design')

/**
 * Ask if the user wants to run FSD checks and offer to install the FSD plugin.
 *
 * This runs when the auto-detection of plugins didn't find anything.
 */
export async function suggestInstallingFsdPlugin() {
  const pm = whichPackageManagerRuns()?.name ?? whichLockfileExists() ?? 'npm'
  const packageJsonPath = pkg.up()
  const addCommand = [pm, 'add', fsdPlugin]

  const theyWantFsdChecks = await confirm({
    message:
      (packageJsonPath === undefined
        ? "Couldn't find a package.json file with Steiger plugins. "
        : `Couldn't find any plugins in ${formatPath(relative(process.cwd(), packageJsonPath))}. `) +
      `Are you trying to check this project's compliance to ${fsdWebsiteLink}?`,
  })

  if (theyWantFsdChecks === false || isCancel(theyWantFsdChecks)) {
    explainHowToFindOtherPlugins(pm)
    throw new ExitException()
  }

  // pnpm will refuse to install the package to the workspace root without explicit confirmation
  if (pm === 'pnpm') {
    try {
      // pnpm workspace roots must have a pnpm-workspace.yaml file
      await access('pnpm-workspace.yaml')
      addCommand.push('--workspace-root')
    } catch {}
  }

  const installCommandCwd = packageJsonPath && dirname(relative(process.cwd(), packageJsonPath))
  // ↓ Will look like "folder-name (path: ..)"
  const formattedCwd =
    installCommandCwd && `${basename(resolve(installCommandCwd))} (path: ${formatPath(installCommandCwd)})`
  const theyWantUsToInstall = await confirm({
    message: `Okay! Would you like to run ${formatCommand(addCommand.join(' '))}${formattedCwd ? ` in ${formattedCwd}` : ''} to install the FSD plugin?`,
    active: 'Yes, run it for me',
    inactive: 'No, exit, I will do it myself',
  })

  if (theyWantUsToInstall === true) {
    let output: Output | undefined
    await tasks([
      {
        title: `Installing the FSD plugin with ${pm}`,
        task: async () => {
          output = await exec(addCommand[0], addCommand.slice(1), { nodeOptions: { cwd: installCommandCwd } })
          if (output.exitCode !== 0) {
            return 'Failed to install the FSD plugin, error message follows'
          }
          return `Installed the FSD plugin with ${pm}`
        },
      },
    ])

    if (output !== undefined) {
      if (output.exitCode !== 0) {
        log.error((output.stderr || output.stdout).trim())
        outro('Something went wrong :(  Please try installing the plugin manually.')
        throw new Error('The command to install the FSD plugin failed')
      } else {
        log.info(output.stdout.trim())
        outro("All done! Now let's run the FSD checks.")
      }
    }
  } else {
    outro("You got it, boss! Run that command whenever you're ready.")
    throw new ExitException()
  }
}

function explainHowToFindOtherPlugins(pm: string) {
  outro(
    `Alright! In that case, find a Steiger plugin and run ${formatCommand(`${pm} add <plugin-name>`)}.\n` +
      pc.dim(
        `   Hint: ${terminalLink(`search for "${pluginNamePrefix}" on npm`, `https://www.npmjs.com/search?q=${pluginNamePrefix}`)} to see what plugins are available`,
      ),
  )
}

function formatPath(path: string): string {
  return pc.blue(path)
}

function formatCommand(command: string): string {
  return pc.green(`\`${command}\``)
}
