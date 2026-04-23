export const pluginNamePrefix = 'steiger-plugin'

/**
 * Checks if a package name corresponds to Steiger plugin naming conventions.
 *
 * The conventions are identical to those of ESLint plugins:
 * - If the package name is scoped, the name must be `@<scope>/steiger-plugin-<name>` or simply `@<scope>/steiger-plugin`.
 * - If the package name is not scoped, the name must be `steiger-plugin-<name>`.
 *
 * @example
 * isSteigerPlugin('@someone/steiger-plugin-foo') // true
 * isSteigerPlugin('steiger-plugin-bar') // true
 * isSteigerPlugin('@someone-else/steiger-plugin') // true
 * isSteigerPlugin('plugin-foo') // false
 * isSteigerPlugin('steiger-foo') // false
 */
export function isSteigerPlugin(packageName: string) {
  if (packageName.includes('/')) {
    const [_scope, name] = packageName.split('/')
    return name.startsWith(pluginNamePrefix)
  } else {
    return packageName.startsWith(`${pluginNamePrefix}-`)
  }
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest

  test('isSteigerPlugin', () => {
    expect(isSteigerPlugin('@someone/steiger-plugin-foo')).toBe(true)
    expect(isSteigerPlugin('steiger-plugin-bar')).toBe(true)
    expect(isSteigerPlugin('@someone-else/steiger-plugin')).toBe(true)
    expect(isSteigerPlugin('plugin-foo')).toBe(false)
    expect(isSteigerPlugin('steiger-foo')).toBe(false)
  })
}
