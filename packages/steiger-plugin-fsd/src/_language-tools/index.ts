import { join } from 'node:path'
import { Parser, Query, Language } from 'web-tree-sitter'

await Parser.init()

type SourceType = 'tsx'

const EXTENSION_MAP: Record<string, SourceType> = {
  tsx: 'tsx',
  jsx: 'tsx',
  ts: 'tsx',
  js: 'tsx',
}

const STATIC_IMPORT_QUERIES: Record<SourceType, string[]> = {
  tsx: [
    '(import_statement source: (string (string_fragment) @path))',
    `(call_expression
        function: (identifier) @_require (#eq? @_require "require")
        arguments: (arguments (string (string_fragment) @path)))`,
  ],
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
  const language = await loadLanguage(sourceType)
  parsers.setLanguage(language)
  const tree = parsers.parse(sourceCode)
  if (tree === null) return []

  const dependencies: string[] = []
  const queries = STATIC_IMPORT_QUERIES[sourceType].map((source) => new Query(language, source))
  for (const query of queries) {
    const matches = query.matches(tree.rootNode)
    dependencies.push(...matches.flatMap((m) => m.captures.map((c) => c.node.text)))
  }

  tree.delete()

  return dependencies
}
