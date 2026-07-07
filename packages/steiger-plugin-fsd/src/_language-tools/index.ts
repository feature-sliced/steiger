import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isBuiltin } from 'node:module'
import { readFileSync } from 'node:fs'
import { Parser, Query, Language, Range, type Tree } from 'web-tree-sitter'
import { createFSCache } from '../_lib/fs-cache.js'

// TODO: replace with import.meta.dirname when upgrading to nodejs 20/22
const __dirname = dirname(fileURLToPath(import.meta.url))

await Parser.init()
const [tsx, svelte, astro, vue] = await Promise.all([
  Language.load(join(__dirname, 'parsers', 'tree-sitter-tsx.wasm')),
  Language.load(join(__dirname, 'parsers', 'tree-sitter-svelte.wasm')),
  Language.load(join(__dirname, 'parsers', 'tree-sitter-astro.wasm')),
  Language.load(join(__dirname, 'parsers', 'tree-sitter-vue.wasm')),
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

function processExtractor(extractor: Extractor, tree: Tree, importType?: 'static' | 'dynamic'): string[] {
  const result: string[] = []

  for (const { query, type } of extractor.queries) {
    if (importType !== undefined && type !== importType) continue

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

interface Dependency {
  path: string
  builtIn: boolean
  dynamic: boolean
}

const cache = createFSCache<Dependency[]>()

function extractAllDependencies(path: string): Dependency[] {
  const extension = extname(path)
  const extractor = extractors.find((extractor) => extractor.extensions.includes(extension))
  if (!extractor) throw new Error(`No extractor found for "${extension}"`)

  const dependencies: Dependency[] = []

  const sourceCode = readFileSync(path, 'utf8')
  const parser = new Parser()
  parser.setLanguage(extractor.language)
  const tree = parser.parse(sourceCode)
  if (tree === null) return []

  dependencies.push(
    ...processExtractor(extractor, tree, 'dynamic').map((dep) => ({
      path: dep,
      builtIn: isBuiltin(dep),
      dynamic: true,
    })),
    ...processExtractor(extractor, tree, 'static').map((dep) => ({
      path: dep,
      builtIn: isBuiltin(dep),
      dynamic: false,
    })),
  )

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
    dependencies.push(
      ...processExtractor(injectedExtractor, injectedTree, 'dynamic').map((dep) => ({
        path: dep,
        builtIn: isBuiltin(dep),
        dynamic: true,
      })),
      ...processExtractor(injectedExtractor, injectedTree, 'static').map((dep) => ({
        path: dep,
        builtIn: isBuiltin(dep),
        dynamic: false,
      })),
    )
    injectedTree.delete()
  }

  tree.delete()

  return dependencies
}

export async function extractDependencies(
  path: string,
  options?: {
    includeBuiltIns?: boolean
    importType?: 'static' | 'dynamic'
  },
): Promise<string[]> {
  const includeBuiltIns = options?.includeBuiltIns ?? false
  const importType = options?.importType

  let dependencies = cache.get(path)
  if (!dependencies) {
    dependencies = extractAllDependencies(path)
    cache.set(path, dependencies)
  }

  return dependencies
    .filter((dep) => {
      if (includeBuiltIns === false && dep.builtIn === true) return false
      if (importType === 'dynamic' && dep.dynamic === false) return false
      if (importType === 'static' && dep.dynamic === true) return false

      return true
    })
    .map((dep) => dep.path)
}
