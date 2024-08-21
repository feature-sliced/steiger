/** @type {import('jscodeshift').Transform} */
export default function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  // Add "fsd/" prefix to FSD rule names
  const fsdRuleSettings = root.find(j.Literal).filter((path) => ruleNames.includes(path.node.value))
  fsdRuleSettings.replaceWith((path) => j.stringLiteral(`fsd/${path.node.value}`))

  // Add an import fsd from '@feature-sliced/steiger-plugin' after the last import or in the beginning
  if (fsdRuleSettings.length > 0) {
    const importDeclarations = root.find(j.ImportDeclaration)
    const importFsdFromSteigerPlugin = j.importDeclaration(
      [j.importDefaultSpecifier(j.identifier('fsd'))],
      j.stringLiteral('@feature-sliced/steiger-plugin'),
    )

    if (importDeclarations.length > 0) {
      importDeclarations.at(-1).insertAfter(importFsdFromSteigerPlugin)
    } else {
      root.find(j.Program).get('body', 0).insertBefore(importFsdFromSteigerPlugin)
    }
  }

  // Make the default export or the argument of `defineConfig` an array unless it already is; include `...fsd.configs.recommended`
  const defineConfigCalls = root.find(j.CallExpression).filter((path) => path.node.callee.name === 'defineConfig')
  const fsdConfigRecommended = j.spreadElement(
    j.memberExpression(j.memberExpression(j.identifier('fsd'), j.identifier('configs')), j.identifier('recommended')),
  )
  if (defineConfigCalls.length > 0) {
    defineConfigCalls.forEach((path) => {
      const config = path.node.arguments[0]

      if (config.type === 'ArrayExpression') {
        return
      }

      path.node.arguments[0] = j.arrayExpression([fsdConfigRecommended, config])
    })
  } else {
    root.find(j.ExportDefaultDeclaration).forEach((path) => {
      const config = path.node.declaration

      if (config.type === 'ArrayExpression') {
        return
      }

      path.node.declaration = j.arrayExpression([fsdConfigRecommended, config])
    })
  }

  return root.toSource()
}

const ruleNames = [
  'ambiguous-slice-names',
  'excessive-slicing',
  'forbidden-imports',
  'inconsistent-naming',
  'insignificant-slice',
  'no-layer-public-api',
  'no-public-api-sidestep',
  'no-reserved-folder-names',
  'no-segmentless-slices',
  'no-segments-on-sliced-layers',
  'public-api',
  'repetitive-naming',
  'segments-by-purpose',
  'shared-lib-grouping',
  'no-processes',
  'import-locality',
]
