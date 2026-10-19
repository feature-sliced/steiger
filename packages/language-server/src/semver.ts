export function semverToNumber(version: string | undefined): number | undefined {
  if (version == null) {
    return undefined
  }

  const match = /^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})(?:[-+][0-9A-Za-z.-]+)?$/.exec(version)
  if (match === null) {
    return undefined
  }

  const [major, minor, patch] = match.slice(1, 4).map((p) => Number.parseInt(p, 10))
  return major * 1_000_000 + minor * 1_000 + patch
}

export function parseSemverOrThrow(version: string): number {
  const result = semverToNumber(version)
  if (result === undefined) {
    throw new Error(`Invalid semver version: ${version}`)
  }

  return result
}
