import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isBuiltin } from 'node:module'
import { readFileSync } from 'node:fs'
import { Parser, Query, Language, Range, type Tree } from 'web-tree-sitter'
import { createFSCache } from '../_lib/fs-cache.js'

// TODO: replace with import.meta.dirname when upgrading to nodejs 20/22
const __dirname = dirname(fileURLToPath(import.meta.url))

await Parser.init()

const parserPaths = [
  join(__dirname, 'parsers', 'tree-sitter-tsx.wasm'),
  join(__dirname, 'parsers', 'tree-sitter-svelte.wasm'),
  join(__dirname, 'parsers', 'tree-sitter-astro.wasm'),
  join(__dirname, 'parsers', 'tree-sitter-vue.wasm'),
]
let tsx: Language
let svelte: Language
let astro: Language
let vue: Language

// Node.js 20 has a bug where loading tree-sitter parsers concurrently via Promise.all can reject. Load sequentially as a fallback.
try {
  ;[tsx, svelte, astro, vue] = await Promise.all(parserPaths.map((path) => Language.load(path)))
} catch (parallelError) {
  console.error(
    '@feature-sliced/steiger-plugin: recovered from a known Node.js 20 bug while loading tree-sitter parsers in parallel. Loading them sequentially instead. Set DEBUG=1 for the full error.',
  )
  if (process.env.DEBUG) {
    console.error(parallelError)
  }

  tsx = await Language.load(parserPaths[0])
  svelte = await Language.load(parserPaths[1])
  astro = await Language.load(parserPaths[2])
  vue = await Language.load(parserPaths[3])
}

interface Extractor {
  type: string
  extensions: string[]
  language: Language
  injections: Array<{ query: Query; lang: string }>
  queries: Array<{ query: Query; type: 'static' | 'dynamic' }>
  /** Matches `export * from` statements, capturing the whole statement as `@statement` and the module specifier as `@path`. */
  wildcardExportQuery?: Query
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
          `(program
            (lexical_declaration
              (variable_declarator
                value: (call_expression
                  function: (identifier) @function.name (#eq? @function.name "require")
                  arguments: (arguments (string (string_fragment) @path))))))`,
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
      {
        query: new Query(
          tsx,
          `(program
            (expression_statement
              (call_expression
                function: (identifier) @function.name (#eq? @function.name "require")
           			arguments: (arguments (string (string_fragment) @path)))))
          `,
        ),
        type: 'dynamic',
      },
    ],
    // Deliberately does not match `export * as ns from`: a namespace re-export adds one name to the
    // module's exports rather than an unknown number of them.
    wildcardExportQuery: new Query(tsx, '(export_statement "*" source: (string (string_fragment) @path)) @statement'),
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
  {
    type: 'vue',
    extensions: ['.vue'],
    language: vue,
    queries: [],
    injections: [
      {
        query: new Query(vue, '(document (script_element (raw_text) @tsx))'),
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

function processExtractor(extractor: Extractor, tree: Tree): Dependency[] {
  const result: Dependency[] = []

  for (const { query, type } of extractor.queries) {
    const matches = query.matches(tree.rootNode)
    for (const match of matches) {
      for (const capture of match.captures) {
        if (capture.name === 'path') {
          result.push({
            builtIn: isBuiltin(capture.node.text),
            path: capture.node.text,
            dynamic: type === 'dynamic',
            start: {
              line: capture.node.startPosition.row + 1,
              column: capture.node.startPosition.column + 1,
            },
            end: {
              line: capture.node.endPosition.row + 1,
              column: capture.node.endPosition.column + 1,
            },
          })
        }
      }
    }
  }

  return result
}

function processWildcardExports(extractor: Extractor, tree: Tree): WildcardExport[] {
  if (extractor.wildcardExportQuery === undefined) return []

  const result: WildcardExport[] = []

  for (const match of extractor.wildcardExportQuery.matches(tree.rootNode)) {
    const pathCapture = match.captures.find((capture) => capture.name === 'path')
    const statementCapture = match.captures.find((capture) => capture.name === 'statement')
    if (pathCapture === undefined || statementCapture === undefined) continue

    result.push({
      path: pathCapture.node.text,
      start: {
        line: statementCapture.node.startPosition.row + 1,
        column: statementCapture.node.startPosition.column + 1,
      },
      end: {
        line: statementCapture.node.endPosition.row + 1,
        column: statementCapture.node.endPosition.column + 1,
      },
    })
  }

  return result
}

interface WildcardExport {
  /** The module specifier that the names are re-exported from. */
  path: string
  // all indexes are 1-based, and they span the whole `export * from` statement
  start: {
    line: number
    column: number
  }
  end: {
    line: number
    column: number
  }
}

interface Dependency {
  path: string
  builtIn: boolean
  dynamic: boolean
  // all indexes are 1-based
  start: {
    line: number
    column: number
  }
  end: {
    line: number
    column: number
  }
}

/**
 * Parse a source file and run `process` on its syntax tree, as well as on the syntax trees of the
 * languages injected into it (for example, the `<script>` block of a Vue component).
 */
function processSourceFile<T>(path: string, process: (extractor: Extractor, tree: Tree) => Array<T>): Array<T> {
  const extension = extname(path)
  const extractor = extractors.find((extractor) => extractor.extensions.includes(extension))
  if (!extractor) throw new Error(`No extractor found for "${extension}"`)

  const results: Array<T> = []

  const sourceCode = readFileSync(path, 'utf8')
  const parser = new Parser()
  parser.setLanguage(extractor.language)
  const tree = parser.parse(sourceCode)
  if (tree === null) return []

  results.push(...process(extractor, tree))

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
    results.push(...process(injectedExtractor, injectedTree))
    injectedTree.delete()
  }

  tree.delete()

  return results
}

const cache = createFSCache<Dependency[]>()

function extractAllDependencies(path: string): Dependency[] {
  return processSourceFile(path, processExtractor)
}

export async function extractDependencies(
  path: string,
  options?: {
    includeBuiltIns?: boolean
    importType?: 'static' | 'dynamic'
  },
): Promise<Dependency[]> {
  const includeBuiltIns = options?.includeBuiltIns ?? false
  const importType = options?.importType

  let dependencies = cache.get(path)
  if (!dependencies) {
    dependencies = extractAllDependencies(path)
    cache.set(path, dependencies)
  }

  return dependencies.filter((dep) => {
    if (includeBuiltIns === false && dep.builtIn === true) return false
    if (importType === 'dynamic' && dep.dynamic === false) return false
    if (importType === 'static' && dep.dynamic === true) return false

    return true
  })
}

const wildcardExportCache = createFSCache<WildcardExport[]>()

/**
 * Find the wildcard re-exports (`export * from`) in a file.
 *
 * Namespace re-exports (`export * as ns from`) are not reported. They add one name to the module's
 * exports, so they don't hide what the module exports.
 */
export async function extractWildcardExports(path: string): Promise<WildcardExport[]> {
  let wildcardExports = wildcardExportCache.get(path)
  if (!wildcardExports) {
    wildcardExports = processSourceFile(path, processWildcardExports)
    wildcardExportCache.set(path, wildcardExports)
  }

  return wildcardExports
}
