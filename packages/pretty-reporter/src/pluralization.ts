/**
 * Returns 's' if the amount is not 1.
 *
 * @example
 * `apple${s(1)}` // 'apple'
 * `apple${s(2)}` // 'apples'
 */
export function s(amount: number) {
  return amount === 1 ? '' : 's'
}
