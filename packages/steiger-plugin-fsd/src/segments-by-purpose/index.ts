import { getLayers, getSegments, getSlices, isSliced } from '@feature-sliced/filesystem'
import type { PartialDiagnostic, Rule } from '@steiger/toolkit'
import { NAMESPACE } from '../constants.js'

const BAD_NAMES_GENERIC = [
  'component',
  'components',
  'helper',
  'helpers',
  'util',
  'utils',
  'constant',
  'constants',
  'const',
  'consts',
  'type',
  'types',
  'store',
  'stores',
  'modal',
  'modals',
  'service',
  'services',
  'function',
  'functions',
  'class',
  'classes',
  'enum',
  'enums',
  'interface',
  'interfaces',
  'decorator',
  'decorators',
  'schema',
  'schemas',
  'handler',
  'handlers',
  'fixture',
  'fixtures',
  'middleware',
  'middlewares',
  'validator',
  'validators',
  'validation',
  'validations',
  'resolver',
  'resolvers',
  'mutation',
  'mutations',
  'asset',
  'assets',
]
const BAD_NAMES_REACT = ['hook', 'hooks', 'context', 'provider', 'providers']
const BAD_NAMES_VUE = ['composable', 'composables', 'directive', 'directives']
const BAD_NAMES_REDUX = [
  'action',
  'actions',
  'reducer',
  'reducers',
  'selector',
  'selectors',
  'effect',
  'effects',
  'saga',
  'sagas',
  'thunk',
  'thunks',
]
const BAD_NAMES_ANGULAR = ['pipe', 'pipes']

const BAD_NAMES = new Set([
  ...BAD_NAMES_GENERIC,
  ...BAD_NAMES_REACT,
  ...BAD_NAMES_VUE,
  ...BAD_NAMES_REDUX,
  ...BAD_NAMES_ANGULAR,
])

/** Discourage the use of segment names that group code by its essence, and instead encourage grouping by purpose. */
const segmentsByPurpose = {
  name: `${NAMESPACE}/segments-by-purpose` as const,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    for (const layer of Object.values(getLayers(root))) {
      if (layer === null) {
        continue
      }

      if (!isSliced(layer)) {
        for (const [segmentName, segment] of Object.entries(getSegments(layer))) {
          if (BAD_NAMES.has(segmentName)) {
            diagnostics.push({
              message: "This segment's name should describe the purpose of its contents, not what the contents are.",
              location: { path: segment.path },
            })
          }
        }
      } else {
        for (const slice of Object.values(getSlices(layer))) {
          for (const [segmentName, segment] of Object.entries(getSegments(slice))) {
            if (BAD_NAMES.has(segmentName)) {
              diagnostics.push({
                message: "This segment's name should describe the purpose of its contents, not what the contents are.",
                location: { path: segment.path },
              })
            }
          }
        }
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default segmentsByPurpose
