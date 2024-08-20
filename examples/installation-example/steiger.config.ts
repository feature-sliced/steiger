import fsd, { type FSDConfigObject } from '@feature-sliced/steiger-plugin'

export default [
  ...fsd.configs.recommended,
  {
    ignores: ['**/node_modules/**'],
    rules: {
      'fsd/shared-lib-grouping': 'off',
    },
  } satisfies FSDConfigObject,
]
