import { fork, type ChildProcess } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'

import { getSteigerBinPath } from '../utils/get-bin-path.js'

const steiger = await getSteigerBinPath()
const fatalMessage = 'Watch shutdown integration failure'
const fatalErrorPreload = `data:text/javascript,${encodeURIComponent(`
process.on('message', (kind) => {
  if (kind === 'exception') throw new Error(${JSON.stringify(fatalMessage)});
  if (kind === 'rejection') void Promise.reject(new Error(${JSON.stringify(fatalMessage)}));
});
`)}`

type Exit = { code: number | null; signal: NodeJS.Signals | null }

async function within<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`CLI did not respond within ${milliseconds}ms`)), milliseconds)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

async function withWatchingCli(run: (child: ChildProcess, exit: Promise<Exit>, stderr: () => string) => Promise<void>) {
  const project = await mkdtemp(join(tmpdir(), 'steiger-watch-shutdown-'))
  let child: ChildProcess | undefined
  let exit: Promise<Exit> | undefined

  try {
    await mkdir(join(project, 'src'))
    await writeFile(join(project, 'src/index.ts'), 'export {}\n')
    await writeFile(
      join(project, 'steiger.config.mjs'),
      `export default [
  {
    meta: { name: 'watch-test', version: '1.0.0' },
    ruleDefinitions: [{ name: 'watch-test/empty', check: () => ({ diagnostics: [] }) }],
  },
  { rules: { 'watch-test/empty': 'error' } },
]\n`,
    )

    child = fork(steiger, ['src', '--watch', '--reporter', 'json'], {
      cwd: project,
      execArgv: ['--import', fatalErrorPreload],
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      env: { ...process.env, NO_COLOR: '1' },
    })
    exit = new Promise<Exit>((resolve) => {
      child!.once('close', (code, signal) => resolve({ code, signal }))
    })

    let stdout = ''
    let stderr = ''
    child.stderr!.setEncoding('utf8').on('data', (data: string) => {
      stderr += data
    })
    const ready = new Promise<void>((resolve, reject) => {
      child!.once('error', reject)
      child!.stdout!.setEncoding('utf8').on('data', (data: string) => {
        stdout += data
        if (stdout.includes('[]\n')) resolve()
      })
    })

    await within(
      Promise.race([
        ready,
        exit.then(({ code, signal }) => {
          throw new Error(`CLI exited before watch was ready (${code ?? signal}): ${stderr}`)
        }),
      ]),
      10_000,
    )
    await run(child, exit, () => stderr)
  } finally {
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL')
    }
    try {
      if (exit) await within(exit, 5_000)
    } finally {
      await rm(project, { recursive: true, force: true })
    }
  }
}

test.skipIf(process.platform === 'win32').each(['SIGINT', 'SIGTERM'] as const)(
  'watch exits successfully after %s',
  async (signal) => {
    await withWatchingCli(async (child, exit) => {
      expect(child.kill(signal)).toBe(true)
      expect(await within(exit, 5_000)).toEqual({ code: 0, signal: null })
    })
  },
  20_000,
)

test.each(['exception', 'rejection'] as const)(
  'watch preserves a fatal %s and exits with a failure',
  async (kind) => {
    await withWatchingCli(async (child, exit, stderr) => {
      child.send(kind)
      const result = await within(exit, 5_000)
      expect(result.signal).toBeNull()
      expect(result.code).toBe(1)
      expect(stderr()).toContain(`Error: ${fatalMessage}`)
    })
  },
  20_000,
)
