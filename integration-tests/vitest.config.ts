import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // These tests spawn the Steiger CLI, and every run pays for Node's startup and for loading the
    // tree-sitter parsers. One run takes several seconds on CI, and a test may need more than one,
    // so the 5 second default is far too tight.
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
})
