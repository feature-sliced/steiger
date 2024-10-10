export function isNegatedGlob(pattern: string) {
  return pattern.startsWith('!')
}

export function getGlobPath(pattern: string) {
  return isNegatedGlob(pattern) ? pattern.slice(1) : pattern
}

export function replaceGlobPath(pattern: string, replacement: string) {
  const sanitizedReplacement = getGlobPath(replacement)
  return isNegatedGlob(pattern) ? `!${sanitizedReplacement}` : sanitizedReplacement
}
