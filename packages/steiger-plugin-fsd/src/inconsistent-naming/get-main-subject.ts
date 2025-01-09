import { wordPattern } from '../inconsistent-naming-scheme/detect-naming-scheme.js'

/**
 * Extract the main subject in a multi-word subject name.
 *
 * @example
 * getMainSubject("a book with pages") // "book"
 * getMainSubject("admin-users") // "users"
 * getMainSubject("receiptsByOrder") // "receipts"
 */
export function getMainSubject(name: string) {
  const words = [...name.matchAll(wordPattern)]
    .map((match) => match[0])
    .filter((word) => !articles.includes(word.toLocaleLowerCase()))

  const prepositionIndex = words.findIndex((word) => prepositions.includes(word.toLocaleLowerCase()))
  if (prepositionIndex === -1) {
    return words[words.length - 1]
  }
  const mainPart = words.slice(0, prepositionIndex)
  return mainPart[mainPart.length - 1]
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest

  test('getMainSubject', () => {
    expect(getMainSubject('a book with pages')).toEqual('book')
    expect(getMainSubject('admin-users')).toEqual('users')
    expect(getMainSubject('receiptsByOrder')).toEqual('receipts')
  })
}

const articles = ['a', 'an', 'the']
const prepositions = [
  'about',
  'above',
  'across',
  'after',
  'against',
  'along',
  'among',
  'around',
  'at',
  'before',
  'behind',
  'below',
  'beneath',
  'beside',
  'besides',
  'between',
  'beyond',
  'but',
  'by',
  'concerning',
  'despite',
  'down',
  'during',
  'except',
  'excepting',
  'for',
  'from',
  'in',
  'inside',
  'into',
  'like',
  'near',
  'of',
  'off',
  'on',
  'onto',
  'out',
  'outside',
  'over',
  'past',
  'regarding',
  'since',
  'through',
  'throughout',
  'to',
  'toward',
  'under',
  'underneath',
  'until',
  'up',
  'upon',
  'with',
  'within',
  'without',
]
