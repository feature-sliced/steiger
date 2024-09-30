import { expect, it, describe } from 'vitest'

import { createFilterAccordingToGlobs } from './create-filter-according-to-globs'
import { minimatch } from 'minimatch'

describe('createFilterAccordingToGlobs', () => {
  it('should return true if no globs are provided', () => {
    console.log(minimatch('/src/shared/ui', '/src/shared/*'))
    const filter = createFilterAccordingToGlobs({
      inclusions: [],
      exclusions: [],
    })
    const files = [
      '/src/shared/ui/styles.css',
      '/src/shared/ui/Button.tsx',
      '/src/shared/ui/TextField.tsx',
      '/src/shared/ui/index.ts',
    ]

    const filteredFiles = files.filter(filter)

    expect(filteredFiles).toEqual(files)
  })

  it('should return the picked folder if a specific folder is passed to inclusion patterns', () => {
    const files = [
      '/src/shared/ui/styles.css',
      '/src/shared/ui/Button.tsx',
      '/src/shared/ui/TextField.tsx',
      '/src/shared/ui/index.ts',
      '/src/entities/user/UserAvatar.tsx',
      '/src/entities/product/ProductCard.tsx',
    ]

    const expected = [
      '/src/shared/ui/styles.css',
      '/src/shared/ui/Button.tsx',
      '/src/shared/ui/TextField.tsx',
      '/src/shared/ui/index.ts',
    ]

    const filter = createFilterAccordingToGlobs({
      inclusions: ['/src/shared/**'],
      exclusions: [],
    })

    const filteredFiles = files.filter(filter)

    expect(filteredFiles).toEqual(expected)
  })

  it('should return all __mock__ folders if the inclusion pattern says to include them all', () => {
    const files = [
      '/src/shared/ui/__mocks__/Button.tsx',
      '/src/shared/ui/styles.css',
      '/src/shared/ui/Button.tsx',
      '/src/shared/ui/TextField.tsx',
      '/src/shared/ui/index.ts',
      '/src/entities/user/__mocks__/UserAvatar.tsx',
      '/src/entities/user/UserAvatar.tsx',
      '/src/entities/product/ProductCard.tsx',
    ]

    const expectedFiles = ['/src/shared/ui/__mocks__/Button.tsx', '/src/entities/user/__mocks__/UserAvatar.tsx']

    const filter = createFilterAccordingToGlobs({
      inclusions: ['**/__mocks__/**'],
      exclusions: [],
    })

    const filteredFiles = files.filter(filter)

    expect(filteredFiles).toEqual(expectedFiles)
  })

  it('should return files picked by extension if the inclusion patterns pick by extension', () => {
    const files = [
      '/src/shared/ui/styles.css',
      '/src/shared/ui/Button.tsx',
      '/src/shared/ui/TextField.tsx',
      '/src/shared/ui/index.ts',
      '/src/entities/user/UserAvatar.tsx',
      '/src/entities/user/styles.css',
      '/src/entities/product/ProductCard.tsx',
    ]

    const expected = ['/src/shared/ui/styles.css', '/src/entities/user/styles.css']

    const filter = createFilterAccordingToGlobs({
      inclusions: ['**/*.css'],
      exclusions: [],
    })

    const filteredFiles = files.filter(filter)

    expect(filteredFiles).toEqual(expected)
  })

  it('should return a specific single file if the inclusion pattern pick that only file', () => {
    const files = [
      '/src/shared/ui/styles.css',
      '/src/shared/ui/Button.tsx',
      '/src/shared/ui/TextField.tsx',
      '/src/shared/ui/index.ts',
      '/src/entities/user/UserAvatar.tsx',
      '/src/entities/user/styles.css',
      '/src/entities/product/ProductCard.tsx',
    ]

    const expected = ['/src/shared/ui/TextField.tsx']

    const filter = createFilterAccordingToGlobs({
      inclusions: ['/src/shared/ui/TextField.tsx'],
      exclusions: [],
    })

    const filteredFiles = files.filter(filter)

    expect(filteredFiles).toEqual(expected)
  })

  it('should correctly handle negations in exclusion patterns', () => {
    const files = [
      '/src/shared/ui/styles.css',
      '/src/shared/ui/Button.tsx',
      '/src/shared/ui/TextField.tsx',
      '/src/shared/ui/index.ts',
      '/src/shared/config/eslint.config.js',
      '/src/shared/config/styling.config.js',
      '/src/entities/user/UserAvatar.tsx',
      '/src/entities/user/styles.css',
      '/src/entities/product/ProductCard.tsx',
    ]

    const expected = [
      '/src/shared/ui/styles.css',
      '/src/shared/ui/Button.tsx',
      '/src/shared/ui/TextField.tsx',
      '/src/shared/ui/index.ts',
      '/src/shared/config/eslint.config.js',
      '/src/entities/user/UserAvatar.tsx',
      '/src/entities/user/styles.css',
      '/src/entities/product/ProductCard.tsx',
    ]

    const filter = createFilterAccordingToGlobs({
      inclusions: [],
      exclusions: ['**/*.config.js', '!**/eslint.config.js'],
    })

    const filteredFiles = files.filter(filter)

    expect(filteredFiles).toEqual(expected)
  })

  it('should return the fs tree without all __mock__ folders if the exclusion pattern says to ignore them all', () => {
    const files = [
      '/src/shared/ui/__mocks__/Button.tsx',
      '/src/shared/ui/styles.css',
      '/src/shared/ui/Button.tsx',
      '/src/shared/ui/TextField.tsx',
      '/src/shared/ui/index.ts',
      '/src/entities/user/__mocks__/UserAvatar.tsx',
      '/src/entities/user/UserAvatar.tsx',
      '/src/entities/product/ProductCard.tsx',
    ]

    const expected = [
      '/src/shared/ui/styles.css',
      '/src/shared/ui/Button.tsx',
      '/src/shared/ui/TextField.tsx',
      '/src/shared/ui/index.ts',
      '/src/entities/user/UserAvatar.tsx',
      '/src/entities/product/ProductCard.tsx',
    ]

    const filter = createFilterAccordingToGlobs({
      inclusions: [],
      exclusions: ['**/__mocks__/**'],
    })

    const filteredFiles = files.filter(filter)

    expect(filteredFiles).toEqual(expected)
  })

  it('should exclude files with specific extension if exclusion pattern is set up accordingly', () => {
    const files = [
      '/src/shared/lib/get-query-params.ts',
      '/src/shared/lib/get-query-params.test.ts',
      '/src/shared/ui/styles.css',
      '/src/shared/ui/Button.tsx',
      '/src/shared/ui/Button.test.tsx',
      '/src/shared/ui/TextField.tsx',
      '/src/shared/ui/TextField.test.tsx',
      '/src/shared/ui/index.ts',
      '/src/entities/user/UserAvatar.tsx',
      '/src/entities/user/UserAvatar.test.tsx',
      '/src/entities/user/styles.css',
      '/src/entities/product/ProductCard.tsx',
    ]

    const expected = [
      '/src/shared/lib/get-query-params.ts',
      '/src/shared/ui/styles.css',
      '/src/shared/ui/Button.tsx',
      '/src/shared/ui/TextField.tsx',
      '/src/shared/ui/index.ts',
    ]

    const filter = createFilterAccordingToGlobs({
      inclusions: ['/src/shared/**'],
      exclusions: ['**/*.test.{tsx,ts}'],
    })

    const filteredFiles = files.filter(filter)

    expect(filteredFiles).toEqual(expected)
  })

  it('should correctly handle folder paths', () => {
    const files = [
      '/src/shared/ui/styles.css',
      '/src/shared/ui/Button.tsx',
      '/src/shared/ui/TextField.tsx',
      '/src/shared/ui/index.ts',
      '/src/shared',
      '/src/shared/ui',
      '/src/entities/user/UserAvatar.tsx',
      '/src/entities/user/styles.css',
      '/src/entities/product/ProductCard.tsx',
    ]

    const expected = [
      '/src/shared/ui/styles.css',
      '/src/shared/ui/Button.tsx',
      '/src/shared/ui/TextField.tsx',
      '/src/shared/ui/index.ts',
      '/src/shared',
      '/src/shared/ui',
    ]

    const filter = createFilterAccordingToGlobs({
      inclusions: ['**/shared', '**/shared/**'],
      exclusions: [],
    })

    const filteredFiles = files.filter(filter)

    expect(filteredFiles).toEqual(expected)
  })
})
