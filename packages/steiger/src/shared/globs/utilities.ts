export function isNegated(pattern: string) {
  return pattern.startsWith('!')
}

export function getGlobPath(pattern: string) {
  return isNegated(pattern) ? pattern.slice(1) : pattern
}

export function replaceGlobPath(pattern: string, replacement: string) {
  const sanitizedReplacement = getGlobPath(replacement)
  return isNegated(pattern) ? `!${sanitizedReplacement}` : sanitizedReplacement
}
