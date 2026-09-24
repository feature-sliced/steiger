/**
 * Pattern that matches one word in different naming conventions.
 *
 * For example, it separately matches "test", "name", and "this" in the following strings:
 *  - TestNameThis
 *  - testNameThis
 *  - test_name_this
 *  - test-name-this
 *  - TEST_NAME_THIS
 */
const wordPattern = /(?:[A-Z]+|[a-z]+)[a-z]*/g

/** Split a name into its lowercased words, the same way the rule's detection does. */
export function wordsIn(name: string): Array<string> {
  return (name.match(wordPattern) ?? []).map((word) => word.toLowerCase())
}

/** Characters that are commonly used to separate words in file and folder names. */
const separatorPattern = /[-_. ]/

/**
 * Remove a trailing word from a name, keeping the casing and the separators of the rest of the name intact.
 *
 * The word is cut out of the original string rather than the name being rebuilt from its words, so that
 * whatever naming convention the author used survives the rename.
 *
 * @returns the shortened name, or `null` if the name doesn't end with that word or if removing it
 * wouldn't leave a usable name behind.
 *
 * @example
 * stripTrailingWord('HomePage', 'page') // => 'Home'
 * stripTrailingWord('home-page', 'page') // => 'home'
 * stripTrailingWord('APIClientPage', 'page') // => 'APIClient'
 * stripTrailingWord('page', 'page') // => null (nothing would be left)
 * stripTrailingWord('pageHome', 'page') // => null (not a trailing word)
 */
export function stripTrailingWord(name: string, word: string): string | null {
  const matches = Array.from(name.matchAll(wordPattern))
  const lastMatch = matches.at(-1)

  if (lastMatch === undefined || lastMatch.index === undefined) {
    return null
  }

  // The word must be the last thing in the name. Names like `home-page-2` or `homePage_` are left
  // alone, because it's not obvious what the author meant by the trailing characters.
  if (lastMatch.index + lastMatch[0].length !== name.length) {
    return null
  }

  if (lastMatch[0].toLowerCase() !== word) {
    return null
  }

  let cutFrom = lastMatch.index

  // Take the separators that led up to the word with it, so that `home-page` becomes `home`, not `home-`.
  while (cutFrom > 0 && separatorPattern.test(name[cutFrom - 1])) {
    cutFrom -= 1
  }

  const newName = name.slice(0, cutFrom)

  // The remainder has to still be a name, not an empty string or a pile of separators.
  if (newName.length === 0 || wordsIn(newName).length === 0) {
    return null
  }

  return newName
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest

  test('stripTrailingWord preserves the original naming convention', () => {
    expect(stripTrailingWord('HomePage', 'page')).toBe('Home')
    expect(stripTrailingWord('homePage', 'page')).toBe('home')
    expect(stripTrailingWord('home-page', 'page')).toBe('home')
    expect(stripTrailingWord('home_page', 'page')).toBe('home')
    expect(stripTrailingWord('HOME_PAGE', 'page')).toBe('HOME')
    expect(stripTrailingWord('APIClientPage', 'page')).toBe('APIClient')
    expect(stripTrailingWord('api-client-page', 'page')).toBe('api-client')
    expect(stripTrailingWord('userAPI', 'api')).toBe('user')
  })

  test('stripTrailingWord refuses names where the word is not trailing', () => {
    expect(stripTrailingWord('pageHome', 'page')).toBe(null)
    expect(stripTrailingWord('page-home', 'page')).toBe(null)
    expect(stripTrailingWord('userLogin', 'user')).toBe(null)
  })

  test('stripTrailingWord refuses names that would become empty', () => {
    expect(stripTrailingWord('page', 'page')).toBe(null)
    expect(stripTrailingWord('_page', 'page')).toBe(null)
    expect(stripTrailingWord('Page', 'page')).toBe(null)
  })

  test('stripTrailingWord refuses names with trailing characters after the word', () => {
    expect(stripTrailingWord('homePage2', 'page')).toBe(null)
    expect(stripTrailingWord('home-page-', 'page')).toBe(null)
  })
}
