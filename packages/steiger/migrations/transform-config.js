/** @type {import('jscodeshift').Transform} */
export default function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  // Add "fsd/" prefix to FSD rule names
  root
    .find(j.Literal)
    .filter((path) => ruleNames.includes(path.node.value))
    .replaceWith((path) => j.stringLiteral(`fsd/${path.node.value}`))

  // Make the default export or the argument of `defineConfig` an array
  const defineConfigCalls = root.find(j.CallExpression).filter((path) => path.node.callee.name === 'defineConfig')

  if (defineConfigCalls.length > 0) {
    defineConfigCalls
      .find(j.ObjectExpression)
      .at(0)
      .replaceWith((path) => j.arrayExpression([path.value]))
  } else {
    root.find(j.ExportDefaultDeclaration).forEach((path) => {
      path.value.declaration = j.arrayExpression([path.value.declaration])
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
