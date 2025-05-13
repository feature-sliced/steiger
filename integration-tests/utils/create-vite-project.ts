import * as fs from 'node:fs/promises'

import { exec } from 'tinyexec'

/** Run `npm create vite` in a given location using the Vanilla TS template (or a template of choice). */
export async function createViteProject(
  location: string,
  { template = 'vanilla-ts' }: { template?: ViteTemplate } = {},
) {
  await fs.rm(location, { recursive: true, force: true })
  await fs.mkdir(location, { recursive: true })
  return exec('npm', ['create', 'vite', '-y', '--', '.', '--template', template], { nodeOptions: { cwd: location } })
}

type ViteTemplate =
  | 'vanilla'
  | 'vanilla-ts'
  | 'vue'
  | 'vue-ts'
  | 'react'
  | 'react-ts'
  | 'preact'
  | 'preact-ts'
  | 'lit'
  | 'lit-ts'
  | 'svelte'
  | 'svelte-ts'
  | 'solid'
  | 'solid-ts'
  | 'qwik'
  | 'qwik-ts'
