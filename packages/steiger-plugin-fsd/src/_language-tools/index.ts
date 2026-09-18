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
  /** Queries for the modules a file pulls in. `static`/`dynamic` describes how the module is loaded. */
  importQueries: Array<{ query: Query; type: 'static' | 'dynamic' }>
  /** Queries for the modules a file re-exports. Each one captures `@statement` and `@source`, and produces one `kind`. */
  reExportQueries: Array<{ query: Query; kind: ReExportInfo['kind'] }>
}

const extractors: Array<Extractor> = [
  {
    type: 'tsx',
    extensions: ['.tsx', '.jsx', '.ts', '.js', '.cjs', '.mjs'],
    language: tsx,
    importQueries: [
      {
        query: new Query(tsx, '(import_statement source: (string (string_fragment) @source))'),
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
                  arguments: (arguments (string (string_fragment) @source))))))`,
        ),
        type: 'static',
      },
      {
        query: new Query(
          tsx,
          `(call_expression
           	function: (import)
            arguments: (arguments (string (string_fragment) @source)))`,
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
           			arguments: (arguments (string (string_fragment) @source)))))
          `,
        ),
        type: 'dynamic',
      },
    ],
    reExportQueries: [
      {
        // `export * from '…'`. The `*` is a direct child here, which is what separates this from a
        // namespace re-export, where the `*` sits inside a `namespace_export` node.
        query: new Query(tsx, '(export_statement "*" source: (string (string_fragment) @source)) @statement'),
        kind: 'all',
      },
      {
        // `export * as ns from '…'`
        query: new Query(
          tsx,
          `(export_statement
            (namespace_export (identifier) @exportedName)
            source: (string (string_fragment) @source)) @statement`,
        ),
        kind: 'namespace',
      },
      {
        // `export { a, b as c } from '…'`. Requiring `source` here is what keeps a local
        // `export { a }`, which names no other module, out of the results.
        query: new Query(
          tsx,
          `(export_statement
            (export_clause) @clause
            source: (string (string_fragment) @source)) @statement`,
        ),
        kind: 'named',
      },
    ],
    injections: [],
  },
  {
    type: 'svelte',
    extensions: ['.svelte'],
    language: svelte,
    importQueries: [],
    reExportQueries: [],
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
    importQueries: [],
    reExportQueries: [],
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
    importQueries: [],
    reExportQueries: [],
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

function rangeOf(node: Node): SourceRange {
  return {
    start: { line: node.startPosition.row + 1, column: node.startPosition.column + 1 },
    end: { line: node.endPosition.row + 1, column: node.endPosition.column + 1 },
  }
}

function readSpecifiers(clause: Node): NamedReExport['specifiers'] {
  const specifiers: NamedReExport['specifiers'] = []

  for (const child of clause.namedChildren) {
    if (child.type !== 'export_specifier') continue

    const name = child.childForFieldName('name')
    if (name === null) continue

    const alias = child.childForFieldName('alias')
    specifiers.push(alias === null ? { name: name.text } : { name: name.text, alias: alias.text })
  }

  return specifiers
}

function collectImports(extractor: Extractor, tree: Tree): ImportInfo[] {
  const result: ImportInfo[] = []

  for (const { query, type } of extractor.importQueries) {
    for (const match of query.matches(tree.rootNode)) {
      for (const capture of match.captures) {
        if (capture.name === 'source') {
          result.push({
            source: capture.node.text,
            builtIn: isBuiltin(capture.node.text),
            dynamic: type === 'dynamic',
            sourceRange: rangeOf(capture.node),
          })
        }
      }
    }
  }

  return result
}

function collectReExports(extractor: Extractor, tree: Tree): ReExportInfo[] {
  const result: ReExportInfo[] = []

  for (const { query, kind } of extractor.reExportQueries) {
    for (const match of query.matches(tree.rootNode)) {
      const captures = new Map(match.captures.map((capture) => [capture.name, capture.node]))

      const statement = captures.get('statement')
      const source = captures.get('source')
      if (statement === undefined || source === undefined) continue

      const common = {
        source: source.text,
        sourceRange: rangeOf(source),
        statementRange: rangeOf(statement),
      }

      if (kind === 'all') {
        result.push({ kind, ...common })
      } else if (kind === 'namespace') {
        const exportedName = captures.get('exportedName')
        if (exportedName === undefined) continue

        result.push({ kind, exportedName: exportedName.text, ...common })
      } else {
        const clause = captures.get('clause')
        if (clause === undefined) continue

        result.push({ kind, specifiers: readSpecifiers(clause), ...common })
      }
    }
  }

  return result
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

export interface ImportInfo {
  /** The module specifier, exactly as it is written in the source. */
  source: string
  builtIn: boolean
  dynamic: boolean
  /** The specifier string on its own, which is the part that import diagnostics point at. */
  sourceRange: SourceRange
}

/** `export * from '…'`, which passes on an unknown set of names. */
export interface WildcardReExport {
  kind: 'all'
  source: string
  sourceRange: SourceRange
  statementRange: SourceRange
}

/** `export * as ns from '…'`, which passes on an unknown set of names, bound to a single identifier. */
export interface NamespaceReExport {
  kind: 'namespace'
  source: string
  /** The name the re-exported module is bound to, `ns` in `export * as ns from '…'`. */
  exportedName: string
  sourceRange: SourceRange
  statementRange: SourceRange
}

/** `export { a, b as c } from '…'`. */
export interface NamedReExport {
  kind: 'named'
  source: string
  specifiers: Array<{ name: string; alias?: string }>
  sourceRange: SourceRange
  statementRange: SourceRange
}

export type ReExportInfo = WildcardReExport | NamespaceReExport | NamedReExport

/**
 * The other modules that a file names, both the ones it imports and the ones it re-exports.
 *
 * `reExports` holds the statements that name another module, and only those. The exports a module
 * declares itself (`export const a = 1`, `export default a`, `export { a }`, and whatever a
 * framework adds on top of a component file) are a different question that no rule asks yet, so
 * this does not model them. A field for them can sit beside this one when a rule needs it.
 */
export interface ModuleAnalysis {
  imports: ImportInfo[]
  reExports: ReExportInfo[]
}

/**
 * Parse a source file and run `visit` on its syntax tree, as well as on the syntax tree of the
 * languages injected into it (for example, the `<script>` block of a Vue component).
 *
 * Every injected region of a file is parsed into a single tree, so a Vue component that has both a
 * `<script>` and a `<script setup>` block is analyzed as one module rather than two.
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
  const imports: ImportInfo[] = []
  const reExports: ReExportInfo[] = []

  forEachSyntaxTree(path, (extractor, tree) => {
    imports.push(...collectImports(extractor, tree))
    reExports.push(...collectReExports(extractor, tree))
  })

  // Queries run one after another, and injected trees come after the outer one, so matches arrive
  // grouped by query rather than in reading order. Sorting keeps diagnostics readable: an index file
  // that mixes `export *` with `export * as ns` would otherwise report its second line first.
  imports.sort((a, b) => comparePositions(a.sourceRange, b.sourceRange))
  reExports.sort((a, b) => comparePositions(a.statementRange, b.statementRange))

  return { imports, reExports }
}

const moduleAnalysisCache = createFSCache<ModuleAnalysis>()

/**
 * Analyze what a module imports and what it re-exports.
 *
 * This parses a file once and caches the whole analysis, so rules that need different parts of it
 * share the work. Callers filter what they get back; the cache always holds everything.
 *
 * Both lists are in source order.
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
 * Re-exports are left out, since a rule asking what a file uses does not want its public API back.
 * Rules that need re-exports read {@link extractReExports} instead.
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

  const { imports } = await analyzeModule(path)

  return imports
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
export async function extractReExports(path: string): Promise<ReExportInfo[]> {
  return (await analyzeModule(path)).reExports
}
