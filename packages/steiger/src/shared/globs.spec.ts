import { expect, it, describe } from 'vitest'

import { createFilterAccordingToGlobs, NodeType } from './globs'

describe('createFilterAccordingToGlobs', () => {
  it('should return true if no globs are provided', () => {
    const filter = createFilterAccordingToGlobs({
      inclusions: [],
      exclusions: [],
    })
    const files: [string, NodeType][] = [
      ['/src/shared/ui/styles.css', 'file'],
      ['/src/shared/ui/Button.tsx', 'file'],
      ['/src/shared/ui/TextField.tsx', 'file'],
      ['/src/shared/ui/index.ts', 'file'],
    ]

    const filteredFiles = files.filter(([path, entity]) => filter(path, entity))

    expect(filteredFiles).toEqual(files)
  })

  it('should return the picked folder if a specific folder is passed to inclusion patterns', () => {
    const files: [string, NodeType][] = [
      ['/src/shared/ui/styles.css', 'file'],
      ['/src/shared/ui/Button.tsx', 'file'],
      ['/src/shared/ui/TextField.tsx', 'file'],
      ['/src/shared/ui/index.ts', 'file'],
      ['/src/entities/user/UserAvatar.tsx', 'file'],
      ['/src/entities/product/ProductCard.tsx', 'file'],
    ]

    const expected: [string, NodeType][] = [
      ['/src/shared/ui/styles.css', 'file'],
      ['/src/shared/ui/Button.tsx', 'file'],
      ['/src/shared/ui/TextField.tsx', 'file'],
      ['/src/shared/ui/index.ts', 'file'],
    ]

    const filter = createFilterAccordingToGlobs({
      inclusions: ['/src/shared/**'],
      exclusions: [],
    })

    const filteredFiles = files.filter(([path, entity]) => filter(path, entity))

    expect(filteredFiles).toEqual(expected)
  })

  it('should return all __mock__ folders if the inclusion pattern says to include them all', () => {
    const files: [string, NodeType][] = [
      ['/src/shared/ui/__mocks__/Button.tsx', 'file'],
      ['/src/shared/ui/styles.css', 'file'],
      ['/src/shared/ui/Button.tsx', 'file'],
      ['/src/shared/ui/TextField.tsx', 'file'],
      ['/src/shared/ui/index.ts', 'file'],
      ['/src/entities/user/__mocks__/UserAvatar.tsx', 'file'],
      ['/src/entities/user/UserAvatar.tsx', 'file'],
      ['/src/entities/product/ProductCard.tsx', 'file'],
    ]

    const expectedFiles: [string, NodeType][] = [
      ['/src/shared/ui/__mocks__/Button.tsx', 'file'],
      ['/src/entities/user/__mocks__/UserAvatar.tsx', 'file'],
    ]

    const filter = createFilterAccordingToGlobs({
      inclusions: ['**/__mocks__/**'],
      exclusions: [],
    })

    const filteredFiles = files.filter(([path, entity]) => filter(path, entity))

    expect(filteredFiles).toEqual(expectedFiles)
  })

  it('should return files picked by extension if the inclusion patterns pick by extension', () => {
    const files: [string, NodeType][] = [
      ['/src/shared/ui/styles.css', 'file'],
      ['/src/shared/ui/Button.tsx', 'file'],
      ['/src/shared/ui/TextField.tsx', 'file'],
      ['/src/shared/ui/index.ts', 'file'],
      ['/src/entities/user/UserAvatar.tsx', 'file'],
      ['/src/entities/user/styles.css', 'file'],
      ['/src/entities/product/ProductCard.tsx', 'file'],
    ]

    const expected: [string, NodeType][] = [
      ['/src/shared/ui/styles.css', 'file'],
      ['/src/entities/user/styles.css', 'file'],
    ]

    const filter = createFilterAccordingToGlobs({
      inclusions: ['**/*.css'],
      exclusions: [],
    })

    const filteredFiles = files.filter(([path, entity]) => filter(path, entity))

    expect(filteredFiles).toEqual(expected)
  })

  it('should return a specific single file if the inclusion pattern pick that only file', () => {
    const files: [string, NodeType][] = [
      ['/src/shared/ui/styles.css', 'file'],
      ['/src/shared/ui/Button.tsx', 'file'],
      ['/src/shared/ui/TextField.tsx', 'file'],
      ['/src/shared/ui/index.ts', 'file'],
      ['/src/entities/user/UserAvatar.tsx', 'file'],
      ['/src/entities/user/styles.css', 'file'],
      ['/src/entities/product/ProductCard.tsx', 'file'],
    ]

    const expected: [string, NodeType][] = [['/src/shared/ui/TextField.tsx', 'file']]

    const filter = createFilterAccordingToGlobs({
      inclusions: ['/src/shared/ui/TextField.tsx'],
      exclusions: [],
    })

    const filteredFiles = files.filter(([path, entity]) => filter(path, entity))

    expect(filteredFiles).toEqual(expected)
  })

  it('should correctly handle negations in exclusion patterns', () => {
    const files: [string, NodeType][] = [
      ['/src/shared/ui/styles.css', 'file'],
      ['/src/shared/ui/Button.tsx', 'file'],
      ['/src/shared/ui/TextField.tsx', 'file'],
      ['/src/shared/ui/index.ts', 'file'],
      ['/src/shared/config/eslint.config.js', 'file'],
      ['/src/shared/config/styling.config.js', 'file'],
      ['/src/entities/user/UserAvatar.tsx', 'file'],
      ['/src/entities/user/styles.css', 'file'],
      ['/src/entities/product/ProductCard.tsx', 'file'],
    ]

    const expected: [string, NodeType][] = [
      ['/src/shared/ui/styles.css', 'file'],
      ['/src/shared/ui/Button.tsx', 'file'],
      ['/src/shared/ui/TextField.tsx', 'file'],
      ['/src/shared/ui/index.ts', 'file'],
      ['/src/shared/config/eslint.config.js', 'file'],
      ['/src/entities/user/UserAvatar.tsx', 'file'],
      ['/src/entities/user/styles.css', 'file'],
      ['/src/entities/product/ProductCard.tsx', 'file'],
    ]

    const filter = createFilterAccordingToGlobs({
      inclusions: [],
      exclusions: ['**/*.config.js', '!**/eslint.config.js'],
    })

    const filteredFiles = files.filter(([path, entity]) => filter(path, entity))

    expect(filteredFiles).toEqual(expected)
  })

  it('should return the fs tree without all __mock__ folders if the exclusion pattern says to ignore them all', () => {
    const files: [string, NodeType][] = [
      ['/src/shared/ui/__mocks__/Button.tsx', 'file'],
      ['/src/shared/ui/styles.css', 'file'],
      ['/src/shared/ui/Button.tsx', 'file'],
      ['/src/shared/ui/TextField.tsx', 'file'],
      ['/src/shared/ui/index.ts', 'file'],
      ['/src/entities/user/__mocks__/UserAvatar.tsx', 'file'],
      ['/src/entities/user/UserAvatar.tsx', 'file'],
      ['/src/entities/product/ProductCard.tsx', 'file'],
    ]

    const expected: [string, NodeType][] = [
      ['/src/shared/ui/styles.css', 'file'],
      ['/src/shared/ui/Button.tsx', 'file'],
      ['/src/shared/ui/TextField.tsx', 'file'],
      ['/src/shared/ui/index.ts', 'file'],
      ['/src/entities/user/UserAvatar.tsx', 'file'],
      ['/src/entities/product/ProductCard.tsx', 'file'],
    ]

    const filter = createFilterAccordingToGlobs({
      inclusions: [],
      exclusions: ['**/__mocks__/**'],
    })

    const filteredFiles = files.filter(([path, entity]) => filter(path, entity))

    expect(filteredFiles).toEqual(expected)
  })

  it('should exclude files with specific extension if exclusion pattern is set up accordingly', () => {
    const files: [string, NodeType][] = [
      ['/src/shared/lib/get-query-params.ts', 'file'],
      ['/src/shared/lib/get-query-params.test.ts', 'file'],
      ['/src/shared/ui/styles.css', 'file'],
      ['/src/shared/ui/Button.tsx', 'file'],
      ['/src/shared/ui/Button.test.tsx', 'file'],
      ['/src/shared/ui/TextField.tsx', 'file'],
      ['/src/shared/ui/TextField.test.tsx', 'file'],
      ['/src/shared/ui/index.ts', 'file'],
      ['/src/entities/user/UserAvatar.tsx', 'file'],
      ['/src/entities/user/UserAvatar.test.tsx', 'file'],
      ['/src/entities/user/styles.css', 'file'],
      ['/src/entities/product/ProductCard.tsx', 'file'],
    ]

    const expected: [string, NodeType][] = [
      ['/src/shared/lib/get-query-params.ts', 'file'],
      ['/src/shared/ui/styles.css', 'file'],
      ['/src/shared/ui/Button.tsx', 'file'],
      ['/src/shared/ui/TextField.tsx', 'file'],
      ['/src/shared/ui/index.ts', 'file'],
    ]

    const filter = createFilterAccordingToGlobs({
      inclusions: ['/src/shared/**'],
      exclusions: ['**/*.test.{tsx,ts}'],
    })

    const filteredFiles = files.filter(([path, entity]) => filter(path, entity))

    expect(filteredFiles).toEqual(expected)
  })

  it('should correctly handle folder paths', () => {
    const files: [string, NodeType][] = [
      ['/src/shared/ui/styles.css', 'file'],
      ['/src/shared/ui/Button.tsx', 'file'],
      ['/src/shared/ui/TextField.tsx', 'file'],
      ['/src/shared/ui/index.ts', 'file'],
      ['/src/shared', 'folder'],
      ['/src/shared/ui', 'folder'],
      ['/src/entities/user/UserAvatar.tsx', 'file'],
      ['/src/entities/user/styles.css', 'file'],
      ['/src/entities/product/ProductCard.tsx', 'file'],
    ]

    const expected: [string, NodeType][] = [
      ['/src/shared/ui/styles.css', 'file'],
      ['/src/shared/ui/Button.tsx', 'file'],
      ['/src/shared/ui/TextField.tsx', 'file'],
      ['/src/shared/ui/index.ts', 'file'],
      ['/src/shared', 'folder'],
      ['/src/shared/ui', 'folder'],
    ]

    const filter = createFilterAccordingToGlobs({
      inclusions: ['**/shared/**'],
      exclusions: [],
    })

    const filteredFiles = files.filter(([path, entity]) => filter(path, entity))

    expect(filteredFiles).toEqual(expected)
  })
})
