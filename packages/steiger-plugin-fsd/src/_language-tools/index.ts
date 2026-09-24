import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isBuiltin } from 'node:module'
import { readFileSync } from 'node:fs'
import { Parser, Query, Language, Range, type Node, type Tree } from 'web-tree-sitter'
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
  /**
   * Queries for the statements that name another module. Each one captures the whole statement as
   * `@statement` and the module specifier as `@source`. `static`/`dynamic` describes how an import
   * loads the module; `re-export` is an `export ... from` statement.
   */
  queries: Array<{ query: Query; type: 'static' | 'dynamic' | 're-export' }>
}

const extractors: Array<Extractor> = [
  {
    type: 'tsx',
    extensions: ['.tsx', '.jsx', '.ts', '.js', '.cjs', '.mjs'],
    language: tsx,
    queries: [
      {
        query: new Query(tsx, '(import_statement source: (string (string_fragment) @source)) @statement'),
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
                  arguments: (arguments (string (string_fragment) @source)))) @statement))`,
        ),
        type: 'static',
      },
      {
        query: new Query(
          tsx,
          `(call_expression
           	function: (import)
            arguments: (arguments (string (string_fragment) @source))) @statement`,
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
           			arguments: (arguments (string (string_fragment) @source)))) @statement)
          `,
        ),
        type: 'dynamic',
      },
      {
        // Every other `require('...')`, wherever it is: inside a function or a block, in a `var`, in an
        // assignment. The top-level forms above match first and keep their type.
        query: new Query(
          tsx,
          `(call_expression
            function: (identifier) @function.name (#eq? @function.name "require")
            arguments: (arguments (string (string_fragment) @source))) @statement`,
        ),
        type: 'dynamic',
      },
      {
        // Every `export ... from '...'`, whatever it exports. Requiring `source` excludes a local
        // `export { a }`, which names no other module. `reExportKind` reads the shape of the
        // statement (`{ a }`, `*`, `* as ns`) off the syntax tree.
        query: new Query(tsx, '(export_statement source: (string (string_fragment) @source)) @statement'),
        type: 're-export',
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

/** A span in a source file. All indexes are 1-based. */
export interface SourceRange {
  start: {
    line: number
    column: number
  }
  end: {
    line: number
    column: number
  }
}

/** `import ... from '...'`, `require('...')` or `import('...')`. */
export interface ImportStatement {
  type: 'import'
  /** The module specifier, exactly as it is written in the source. */
  source: string
  builtIn: boolean
  dynamic: boolean
  /** The specifier string alone. Import diagnostics point at this range. */
  sourceRange: SourceRange
  statementRange: SourceRange
}

/** `export ... from '...'`. */
export interface ReExportStatement {
  type: 're-export'
  /**
   * The shape of the statement:
   * - `named`: `export { a, b as c } from '...'`
   * - `wildcard`: `export * from '...'`
   * - `namespace`: `export * as ns from '...'`
   *
   * A wildcard or namespace re-export passes on whatever the other module exports. The type-only
   * forms (`export type { a } from`, `export type * from`, `export type * as ns from`) have the
   * same kinds as their value counterparts.
   */
  kind: 'named' | 'wildcard' | 'namespace'
  /** The module specifier, exactly as it is written in the source. */
  source: string
  builtIn: boolean
  sourceRange: SourceRange
  statementRange: SourceRange
}

/** A statement that names another module. */
export type Statement = ImportStatement | ReExportStatement

/**
 * Every statement of a module that names another module, in source order.
 *
 * The exports a module declares itself (`export const a = 1`, `export default a`, `export { a }`, and
 * whatever a framework adds on top of a component file) name no other module, so they are not here.
 */
export interface ModuleAnalysis {
  statements: Statement[]
}

function rangeOf(node: Node): SourceRange {
  return {
    start: { line: node.startPosition.row + 1, column: node.startPosition.column + 1 },
    end: { line: node.endPosition.row + 1, column: node.endPosition.column + 1 },
  }
}

function reExportKind(statement: Node): ReExportStatement['kind'] | undefined {
  for (const child of statement.children) {
    if (child.type === 'namespace_export') return 'namespace'
    if (child.type === 'export_clause') return 'named'
    if (child.type === '*') return 'wildcard'
  }

  return undefined
}

function collectStatements(extractor: Extractor, tree: Tree): Statement[] {
  const result: Statement[] = []
  // A module specifier can be matched by more than one query (a top-level `require` also matches the
  // catch-all one). The first query to match it decides how it is reported.
  const seenSources = new Set<number>()

  for (const { query, type } of extractor.queries) {
    for (const match of query.matches(tree.rootNode)) {
      const captures = new Map(match.captures.map((capture) => [capture.name, capture.node]))

      const statement = captures.get('statement')
      const source = captures.get('source')
      if (statement === undefined || source === undefined) continue
      if (seenSources.has(source.startIndex)) continue
      seenSources.add(source.startIndex)

      const common = {
        source: source.text,
        builtIn: isBuiltin(source.text),
        sourceRange: rangeOf(source),
        statementRange: rangeOf(statement),
      }

      if (type === 're-export') {
        const kind = reExportKind(statement)
        if (kind === undefined) continue

        result.push({ type: 're-export', kind, ...common })
      } else {
        result.push({ type: 'import', dynamic: type === 'dynamic', ...common })
      }
    }
  }

  return result
}

/**
 * Parse a source file and run `visit` on its syntax tree, as well as on the syntax tree of the
 * languages injected into it (for example, the `<script>` block of a Vue component).
 *
 * Every injected region of a file is parsed into a single tree, so a Vue component that has both a
 * `<script>` and a `<script setup>` block is analyzed as one module.
 */
function forEachSyntaxTree(path: string, visit: (extractor: Extractor, tree: Tree) => void): void {
  const extension = extname(path)
  const extractor = extractors.find((extractor) => extractor.extensions.includes(extension))
  if (!extractor) throw new Error(`No extractor found for "${extension}"`)

  const sourceCode = readFileSync(path, 'utf8')
  const parser = new Parser()
  parser.setLanguage(extractor.language)
  const tree = parser.parse(sourceCode)
  if (tree === null) return

  visit(extractor, tree)

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
    visit(injectedExtractor, injectedTree)
    injectedTree.delete()
  }

  tree.delete()
}

function comparePositions(a: SourceRange, b: SourceRange): number {
  return a.start.line - b.start.line || a.start.column - b.start.column
}

function analyzeSourceFile(path: string): ModuleAnalysis {
  const statements: Statement[] = []

  forEachSyntaxTree(path, (extractor, tree) => {
    statements.push(...collectStatements(extractor, tree))
  })

  // Matches arrive grouped by query, and injected trees come after the outer one. Without sorting,
  // every `require` would follow every `import`, and every re-export would follow every import.
  // Sorting restores reading order, so diagnostics come out in line order.
  statements.sort((a, b) => comparePositions(a.statementRange, b.statementRange))

  return { statements }
}

const moduleAnalysisCache = createFSCache<ModuleAnalysis>()

/**
 * Collect the imports and re-exports of a module.
 *
 * This parses the file once and caches the whole analysis, so rules that need different parts of
 * it share the work. Repeat calls for the same unchanged file return the same object. Callers
 * filter it as they need.
 */
export async function analyzeModule(path: string): Promise<ModuleAnalysis> {
  let analysis = moduleAnalysisCache.get(path)
  if (!analysis) {
    analysis = analyzeSourceFile(path)
    moduleAnalysisCache.set(path, analysis)
  }

  return analysis
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
 * Find the modules that a file imports.
 *
 * Re-exports are left out. {@link extractReExports} returns those.
 */
export async function extractDependencies(
  path: string,
  options?: {
    includeBuiltIns?: boolean
    importType?: 'static' | 'dynamic'
  },
): Promise<Dependency[]> {
  const includeBuiltIns = options?.includeBuiltIns ?? false
  const importType = options?.importType

  const { statements } = await analyzeModule(path)

  return statements
    .filter((statement): statement is ImportStatement => statement.type === 'import')
    .filter((moduleImport) => {
      if (includeBuiltIns === false && moduleImport.builtIn === true) return false
      if (importType === 'dynamic' && moduleImport.dynamic === false) return false
      if (importType === 'static' && moduleImport.dynamic === true) return false

      return true
    })
    .map((moduleImport) => ({
      path: moduleImport.source,
      builtIn: moduleImport.builtIn,
      dynamic: moduleImport.dynamic,
      start: moduleImport.sourceRange.start,
      end: moduleImport.sourceRange.end,
    }))
}

/** Find the modules that a file re-exports, in source order. */
export async function extractReExports(path: string): Promise<ReExportStatement[]> {
  const { statements } = await analyzeModule(path)

  return statements.filter((statement): statement is ReExportStatement => statement.type === 're-export')
}
