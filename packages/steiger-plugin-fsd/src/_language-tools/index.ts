import { join } from 'node:path'
import { Parser, Query, Language, Range } from 'web-tree-sitter'

await Parser.init()

type SourceType = 'tsx' | 'svelte' | 'astro'

const EXTENSION_MAP: Record<string, SourceType> = {
  tsx: 'tsx',
  jsx: 'tsx',
  ts: 'tsx',
  js: 'tsx',
  svelte: 'svelte',
}

const CAPTURE_NAME = 'path'
const STATIC_IMPORT_QUERIES: Record<SourceType, string[]> = {
  tsx: [
    '(import_statement source: (string (string_fragment) @path))',
    `(call_expression
        function: (identifier) @_require (#eq? @_require "require")
        arguments: (arguments (string (string_fragment) @path)))`,
  ],
  svelte: ['(script_element (raw_text) @source)'],
  astro: ['(frontmatter_js_block) @source'],
}

const languges: Map<SourceType, Language> = new Map()

async function loadLanguage(sourceType: SourceType): Promise<Language> {
  if (languges.has(sourceType)) return languges.get(sourceType)!

  switch (sourceType) {
    case 'tsx': {
      const tsx = await Language.load(join(import.meta.dirname, 'parsers', 'tree-sitter-tsx.wasm'))
      languges.set(sourceType, tsx)
      return tsx
    }
    case 'svelte': {
      const [, svelte] = await Promise.all([
        loadLanguage('tsx'),
        Language.load(join(import.meta.dirname, 'parsers', 'tree-sitter-svelte.wasm')),
      ])
      languges.set(sourceType, svelte)
      return svelte
    }
    case 'astro': {
      const [, astro] = await Promise.all([
        loadLanguage('tsx'),
        Language.load(join(import.meta.dirname, 'parsers', 'tree-sitter-astro.wasm')),
      ])
      languges.set(sourceType, astro)
      return astro
    }
    default:
      throw new Error(`Unsupported language: ${sourceType}`)
  }
}

export function getSourceType(sourcePath: string): SourceType | undefined {
  const extension = sourcePath.split('.').at(-1)
  if (!extension) return undefined

  return EXTENSION_MAP[extension]
}

export async function extractDependencies(sourceType: SourceType, sourceCode: string): Promise<string[]> {
  const parsers = new Parser()
  let language = await loadLanguage(sourceType)
  parsers.setLanguage(language)
  let tree = parsers.parse(sourceCode)
  if (tree === null) return []

  if (sourceType === 'svelte') {
    const query = new Query(language, STATIC_IMPORT_QUERIES.svelte[0])
    const matches = query.matches(tree.rootNode)

    const includedRanges: Range[] = []
    for (const match of matches) {
      for (const capture of match.captures) {
        if (capture.name === 'source') {
          includedRanges.push({
            startIndex: capture.node.startIndex,
            endIndex: capture.node.endIndex,
            startPosition: capture.node.startPosition,
            endPosition: capture.node.endPosition,
          })
        }
      }
    }

    language = await loadLanguage('tsx')
    parsers.setLanguage(language)
    tree.delete()
    tree = parsers.parse(sourceCode, null, { includedRanges })
    if (tree === null) return []
  } else if (sourceType === 'astro') {
    const query = new Query(language, STATIC_IMPORT_QUERIES.astro[0])
    const matches = query.matches(tree.rootNode)

    const includedRanges: Range[] = []
    for (const match of matches) {
      for (const capture of match.captures) {
        if (capture.name === 'source') {
          includedRanges.push({
            startIndex: capture.node.startIndex,
            endIndex: capture.node.endIndex,
            startPosition: capture.node.startPosition,
            endPosition: capture.node.endPosition,
          })
        }
      }
    }

    language = await loadLanguage('tsx')
    parsers.setLanguage(language)
    tree.delete()
    tree = parsers.parse(sourceCode, null, { includedRanges })
    if (tree === null) return []
  }

  const dependencies: string[] = []
  const queries = STATIC_IMPORT_QUERIES['tsx'].map((source) => new Query(language, source))
  for (const query of queries) {
    const matches = query.matches(tree.rootNode)
    dependencies.push(
      ...matches.flatMap((m) => m.captures.filter((c) => c.name === CAPTURE_NAME).map((c) => c.node.text)),
    )
  }

  tree.delete()

  return dependencies
}
