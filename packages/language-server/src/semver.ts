export function semverToNumber(version: string | undefined): number | undefined {
  if (version === '' || version == null) {
    return undefined
  }
  if (!/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(version)) {
    return undefined
  }

  const [major, minor, patch] = version.split('.').map((p) => Number.parseInt(p, 10))

  return major * 1_000_000 + minor * 1_000 + patch
}
