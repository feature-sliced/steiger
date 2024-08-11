import { expect, it, describe } from 'vitest'

import applyGlobs from './apply-globs'
import { joinFromRoot, parseIntoFsdRoot } from '../../../steiger-plugin-fsd/src/_lib/prepare-test'

describe('applyGlobs', () => {
  it('should return the passed folder if no globs are provided', () => {
    const root = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 styles.css
          📄 Button.tsx
          📄 TextField.tsx
          📄 index.ts
    `,
      joinFromRoot('src'),
    )

    expect(applyGlobs(root, {})).toEqual(root)
    expect(
      applyGlobs(root, {
        inclusions: [],
        exclusions: [],
      }),
    ).toEqual(root)
  })

  it('should return the picked folder if a specific folder is passed to inclusion patterns', () => {
    const root = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 styles.css
          📄 Button.tsx
          📄 TextField.tsx
          📄 index.ts
      📂 entities
        📂 user
          📄 UserAvatar.tsx
        📂 product
          📄 ProductCard.tsx
    `,
      joinFromRoot('src'),
    )

    const expected = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 styles.css
          📄 Button.tsx
          📄 TextField.tsx
          📄 index.ts
    `,
      joinFromRoot('src'),
    )

    const actual = applyGlobs(root, {
      inclusions: ['/src/shared/**'],
      exclusions: [],
    })

    expect(actual).toEqual(expected)
  })

  it('should return all __mock__ folders if the inclusion pattern says to include them all', () => {
    const root = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📂 __mocks__
            📄 Button.tsx
          📄 styles.css
          📄 Button.tsx
          📄 TextField.tsx
          📄 index.ts
      📂 entities
        📂 user
          📂 __mocks__
            📄 UserAvatar.tsx
          📄 UserAvatar.tsx
        📂 product
          📄 ProductCard.tsx
    `,
      joinFromRoot('src'),
    )

    const expected = parseIntoFsdRoot(
      `
       📂 shared
         📂 ui
           📂 __mocks__
             📄 Button.tsx
       📂 entities
         📂 user
           📂 __mocks__
             📄 UserAvatar.tsx
    `,
      joinFromRoot('src'),
    )

    const actual = applyGlobs(root, {
      inclusions: ['**/__mocks__/**'],
      exclusions: [],
    })

    expect(actual).toEqual(expected)
  })

  it('should return files picked by extension if the inclusion patterns pick by extension', () => {
    const root = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 styles.css
          📄 Button.tsx
          📄 TextField.tsx
          📄 index.ts
      📂 entities
        📂 user
          📄 styles.css
          📄 UserAvatar.tsx
        📂 product
          📄 ProductCard.tsx
    `,
      joinFromRoot('src'),
    )

    const expected = parseIntoFsdRoot(
      `
       📂 shared
         📂 ui
           📄 styles.css
       📂 entities
         📂 user
           📄 styles.css
    `,
      joinFromRoot('src'),
    )

    const actual = applyGlobs(root, {
      inclusions: ['**/*.css'],
      exclusions: [],
    })

    expect(actual).toEqual(expected)
  })

  it('should return a specific single file if the inclusion pattern pick that only file', () => {
    const root = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 styles.css
          📄 Button.tsx
          📄 TextField.tsx
          📄 index.ts
      📂 entities
        📂 user
          📄 styles.css
          📄 UserAvatar.tsx
        📂 product
          📄 ProductCard.tsx
    `,
      joinFromRoot('src'),
    )

    const expected = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 TextField.tsx
    `,
      joinFromRoot('src'),
    )

    const actual = applyGlobs(root, {
      inclusions: ['/src/shared/ui/TextField.tsx'],
      exclusions: [],
    })

    expect(actual).toEqual(expected)
  })

  it('should correctly handle negations in exclusion patterns', () => {
    const root = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 styles.css
          📄 Button.tsx
          📄 TextField.tsx
          📄 index.ts
        📂 config
          📄 eslint.config.js
          📄 styling.config.js
      📂 entities
        📂 user
          📄 styles.css
          📄 UserAvatar.tsx
        📂 product
          📄 ProductCard.tsx
    `,
      joinFromRoot('src'),
    )

    const expected = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📄 styles.css
          📄 Button.tsx
          📄 TextField.tsx
          📄 index.ts
        📂 config
          📄 eslint.config.js
      📂 entities
        📂 user
          📄 styles.css
          📄 UserAvatar.tsx
        📂 product
          📄 ProductCard.tsx
    `,
      joinFromRoot('src'),
    )

    const actual = applyGlobs(root, {
      exclusions: ['**/*.config.js', '!**/eslint.config.js'],
    })

    expect(actual).toEqual(expected)
  })

  it('should return the fs tree without all __mock__ folders if the exclusion pattern says to ignore them all', () => {
    const root = parseIntoFsdRoot(
      `
      📂 shared
        📂 ui
          📂 __mocks__
            📄 Button.tsx
          📄 styles.css
          📄 Button.tsx
          📄 TextField.tsx
          📄 index.ts
      📂 entities
        📂 user
          📂 __mocks__
            📄 UserAvatar.tsx
          📄 UserAvatar.tsx
        📂 product
          📄 ProductCard.tsx
    `,
      joinFromRoot('src'),
    )

    const expected = parseIntoFsdRoot(
      `
       📂 shared
         📂 ui
           📄 styles.css
           📄 Button.tsx
           📄 TextField.tsx
           📄 index.ts
       📂 entities
         📂 user
           📄 UserAvatar.tsx
         📂 product
           📄 ProductCard.tsx
    `,
      joinFromRoot('src'),
    )

    const actual = applyGlobs(root, {
      inclusions: [],
      exclusions: ['**/__mocks__/**'],
    })

    expect(actual).toEqual(expected)
  })

  it('should exclude files with specific extension if exclusion pattern is set up accordingly', () => {
    const root = parseIntoFsdRoot(
      `
      📂 shared
        📂 lib
          📄 get-query-params.ts
          📄 get-query-params.test.ts
        📂 ui
          📄 styles.css
          📄 Button.tsx
          📄 Button.test.tsx
          📄 TextField.tsx
          📄 TextField.test.tsx
          📄 index.ts
      📂 entities
        📂 user
          📄 styles.css
          📄 UserAvatar.tsx
          📄 UserAvatar.test.tsx
        📂 product
          📄 ProductCard.tsx
    `,
      joinFromRoot('src'),
    )

    const expected = parseIntoFsdRoot(
      `
      📂 shared
        📂 lib
          📄 get-query-params.ts
        📂 ui
          📄 styles.css
          📄 Button.tsx
          📄 TextField.tsx
          📄 index.ts
    `,
      joinFromRoot('src'),
    )

    const actual = applyGlobs(root, {
      inclusions: ['/src/shared/**'],
      exclusions: ['**/*.test.{tsx,ts}'],
    })

    expect(actual).toEqual(expected)
  })
})
