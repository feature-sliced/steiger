import { expect, it, assert } from 'vitest'
import { PartialDiagnostic } from '@steiger/toolkit'
import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'

import segmentsByPurpose from './index.js'

const assertIncludeBadSegment = (diagnostics: Array<PartialDiagnostic>, path: string) => {
  assert.deepInclude(diagnostics, {
    message: "This segment's name should describe the purpose of its contents, not what the contents are.",
    location: { path },
  })
}

it('reports no errors on a project with good segments', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.ts
      📂 lib
        📄 index.ts
    📂 entities
      📂 user
        📂 ui
        📂 model
        📄 index.ts
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
  `)

  expect(segmentsByPurpose.check(root)).toEqual({ diagnostics: [] })
})

it('reports errors on a project with bad segments', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 ui
        📄 index.ts
      📂 assets
        📄 index.ts
      📂 constants
        📄 index.ts
      📂 consts
        📄 index.ts
      📂 modals
        📄 index.ts
      📂 hooks
        📄 index.ts
      📂 helpers
        📄 index.ts
      📂 utils
        📄 index.ts
      📂 services
        📄 index.ts
      📂 functions
        📄 index.ts
      📂 classes
        📄 index.ts
      📂 enums
        📄 index.ts
      📂 interfaces
        📄 index.ts
      📂 decorators
        📄 index.ts
      📂 schemas
        📄 index.ts
      📂 handlers
        📄 index.ts
      📂 fixtures
        📄 index.ts
      📂 middlewares
        📄 index.ts
      📂 validators
        📄 index.ts
      📂 validations
        📄 index.ts
      📂 resolvers
        📄 index.ts
      📂 mutations
        📄 index.ts
      📂 stores
        📄 index.ts
      📂 types
        📄 index.ts
    📂 entities
      📂 user
        📂 components
        📂 model
        📄 index.ts
    📂 pages
      📂 home
        📂 ui
        📄 index.ts
  `)

  const diagnostics = segmentsByPurpose.check(root).diagnostics
  assertIncludeBadSegment(diagnostics, joinFromRoot('entities', 'user', 'components'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'assets'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'classes'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'constants'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'consts'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'decorators'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'enums'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'fixtures'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'functions'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'handlers'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'helpers'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'hooks'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'interfaces'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'middlewares'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'modals'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'mutations'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'resolvers'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'schemas'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'services'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'stores'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'types'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'utils'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'validations'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'validators'))
})

it('reports errors on Redux-style segments', () => {
  const root = parseIntoFsdRoot(`
    📂 entities
      📂 user
        📂 model
        📂 action
          📄 index.ts
        📂 actions
          📄 index.ts
        📂 reducer
          📄 index.ts
        📂 reducers
          📄 index.ts
        📂 selector
          📄 index.ts
        📂 selectors
          📄 index.ts
        📂 saga
          📄 index.ts
        📂 sagas
          📄 index.ts
        📂 thunk
          📄 index.ts
        📂 thunks
          📄 index.ts
        📂 effect
          📄 index.ts
        📂 effects
          📄 index.ts
        📄 index.ts
  `)

  const diagnostics = segmentsByPurpose.check(root).diagnostics
  assertIncludeBadSegment(diagnostics, joinFromRoot('entities', 'user', 'action'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('entities', 'user', 'actions'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('entities', 'user', 'effect'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('entities', 'user', 'effects'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('entities', 'user', 'reducer'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('entities', 'user', 'reducers'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('entities', 'user', 'saga'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('entities', 'user', 'sagas'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('entities', 'user', 'selector'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('entities', 'user', 'selectors'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('entities', 'user', 'thunk'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('entities', 'user', 'thunks'))
})

it('reports errors on Angular-style segments', () => {
  const root = parseIntoFsdRoot(`
    📂 features
      📂 auth
        📂 model
        📂 pipe
          📄 index.ts
        📂 pipes
          📄 index.ts
        📄 index.ts
  `)

  const diagnostics = segmentsByPurpose.check(root).diagnostics
  assertIncludeBadSegment(diagnostics, joinFromRoot('features', 'auth', 'pipe'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('features', 'auth', 'pipes'))
})

it('reports errors on React-style segments', () => {
  const root = parseIntoFsdRoot(`
    📂 features
      📂 auth
        📂 model
        📂 context
          📄 index.ts
        📂 hook
          📄 index.ts
        📂 hooks
          📄 index.ts
        📂 provider
          📄 index.ts
        📂 providers
          📄 index.ts
        📄 index.ts
  `)

  const diagnostics = segmentsByPurpose.check(root).diagnostics
  assertIncludeBadSegment(diagnostics, joinFromRoot('features', 'auth', 'context'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('features', 'auth', 'hook'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('features', 'auth', 'hooks'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('features', 'auth', 'provider'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('features', 'auth', 'providers'))
})

it('reports errors on Vue-style segments', () => {
  const root = parseIntoFsdRoot(`
    📂 features
      📂 board
        📂 model
        📂 composable
          📄 index.ts
        📂 composables
          📄 index.ts
        📂 directive
          📄 index.ts
        📂 directives
          📄 index.ts
        📄 index.ts
  `)

  const diagnostics = segmentsByPurpose.check(root).diagnostics
  assertIncludeBadSegment(diagnostics, joinFromRoot('features', 'board', 'composable'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('features', 'board', 'composables'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('features', 'board', 'directive'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('features', 'board', 'directives'))
})

it('reports errors on singular generic segment names', () => {
  const root = parseIntoFsdRoot(`
    📂 shared
      📂 asset
        📄 index.ts
      📂 class
        📄 index.ts
      📂 component
        📄 index.ts
      📂 const
        📄 index.ts
      📂 constant
        📄 index.ts
      📂 decorator
        📄 index.ts
      📂 enum
        📄 index.ts
      📂 fixture
        📄 index.ts
      📂 function
        📄 index.ts
      📂 handler
        📄 index.ts
      📂 helper
        📄 index.ts
      📂 interface
        📄 index.ts
      📂 middleware
        📄 index.ts
      📂 modal
        📄 index.ts
      📂 mutation
        📄 index.ts
      📂 resolver
        📄 index.ts
      📂 schema
        📄 index.ts
      📂 service
        📄 index.ts
      📂 store
        📄 index.ts
      📂 type
        📄 index.ts
      📂 util
        📄 index.ts
      📂 validation
        📄 index.ts
      📂 validator
        📄 index.ts
  `)

  const diagnostics = segmentsByPurpose.check(root).diagnostics
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'asset'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'class'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'component'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'const'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'constant'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'decorator'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'enum'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'fixture'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'function'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'handler'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'helper'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'interface'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'middleware'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'modal'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'mutation'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'resolver'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'schema'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'service'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'store'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'type'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'util'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'validation'))
  assertIncludeBadSegment(diagnostics, joinFromRoot('shared', 'validator'))
})
