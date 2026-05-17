import { join, extname } from 'node:path'
import { Parser, Query, Language, Range, type Tree } from 'web-tree-sitter'

await Parser.init()
const [tsx, svelte, astro] = await Promise.all([
  Language.load(join(import.meta.dirname, 'parsers', 'tree-sitter-tsx.wasm')),
  Language.load(join(import.meta.dirname, 'parsers', 'tree-sitter-svelte.wasm')),
  Language.load(join(import.meta.dirname, 'parsers', 'tree-sitter-astro.wasm')),
])

interface Extractor {
  type: string
  extensions: string[]
  language: Language
  injections: Array<{ query: Query; lang: string }>
  queries: Array<{ query: Query; type: 'static' | 'dynamic' }>
}

const extractors: Array<Extractor> = [
  {
    type: 'tsx',
    extensions: ['.tsx', '.jsx', '.ts', '.js', '.cjs', '.mjs'],
    language: tsx,
    queries: [
      {
        query: new Query(tsx, '(import_statement source: (string (string_fragment) @path))'),
        type: 'static',
      },
      {
        query: new Query(
          tsx,
          `(call_expression
            function: (identifier) @_require (#eq? @_require "require")
            arguments: (arguments (string (string_fragment) @path)))`,
        ),
        type: 'static',
      },
      {
        query: new Query(
          tsx,
          `(call_expression
           	function: (import)
            arguments: (arguments (string (string_fragment) @path)))`,
        ),
        type: 'dynamic',
      },
    ],
    injections: [],
  },
  {
    type: 'svelte',
    extensions: ['.svelte'],
    language: svelte,
    queries: [],
    injections: [
      {
        query: new Query(svelte, '(script_element (raw_text) @tsx)'),
        lang: 'tsx',
      },
    ],
  },
  {
    type: 'astro',
    extensions: ['.astro'],
    language: astro,
    queries: [],
    injections: [
      {
        query: new Query(astro, '(frontmatter_js_block) @tsx'),
        lang: 'tsx',
      },
    ],
  },
]

export function getSourceType(sourcePath: string): string | undefined {
  const extension = extname(sourcePath)
  for (const extractor of extractors) {
    if (extractor.extensions.includes(extension)) {
      return extractor.type
    }
  }

  return undefined
}

function processExtractor(extractor: Extractor, tree: Tree): string[] {
  const result: string[] = []

  for (const { query } of extractor.queries) {
    const matches = query.matches(tree.rootNode)
    for (const match of matches) {
      for (const capture of match.captures) {
        if (capture.name === 'path') {
          result.push(capture.node.text)
        }
      }
    }
  }

  return result
}

export async function extractDependencies(sourceType: string, sourceCode: string): Promise<string[]> {
  const extractor = extractors.find((extractor) => extractor.type === sourceType)
  if (!extractor) throw new Error(`No extractor found for "${sourceType}"`)

  const dependencies: string[] = []

  const parser = new Parser()
  parser.setLanguage(extractor.language)
  const tree = parser.parse(sourceCode)
  if (tree === null) return dependencies

  dependencies.push(...processExtractor(extractor, tree))

  for (const { query, lang } of extractor.injections) {
    const injectedExtractor = extractors.find((extractor) => extractor.type === lang)
    if (!injectedExtractor) throw new Error(`No extractor found for "${lang}"`)

    const matches = query.matches(tree.rootNode)

    const includedRanges: Range[] = []
    for (const match of matches) {
      for (const capture of match.captures) {
        if (capture.name === lang) {
          includedRanges.push({
            startIndex: capture.node.startIndex,
            endIndex: capture.node.endIndex,
            startPosition: capture.node.startPosition,
            endPosition: capture.node.endPosition,
          })
        }
      }
    }

    parser.setLanguage(injectedExtractor.language)
    const injectedTree = parser.parse(sourceCode, null, { includedRanges })
    if (injectedTree === null) continue
    dependencies.push(...processExtractor(injectedExtractor, injectedTree))
    injectedTree.delete()
  }

  tree.delete()

  return dependencies
}
