import { expect, it } from 'vitest'

import segmentsByPurpose from './index.js'
import { compareMessages, joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'

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

  const diagnostics = segmentsByPurpose.check(root).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('entities', 'user', 'components') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'classes') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'decorators') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'enums') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'fixtures') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'functions') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'handlers') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'helpers') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'hooks') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'interfaces') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'middlewares') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'modals') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'mutations') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'resolvers') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'schemas') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'services') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'utils') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'validations') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('shared', 'validators') },
    },
  ])
})

it('reports errors on Redux-style segments', () => {
  const root = parseIntoFsdRoot(`
    📂 entities
      📂 user
        📂 model
        📂 actions
          📄 index.ts
        📂 reducers
          📄 index.ts
        📂 selectors
          📄 index.ts
        📂 sagas
          📄 index.ts
        📂 thunks
          📄 index.ts
        📂 effects
          📄 index.ts
        📄 index.ts
  `)

  const diagnostics = segmentsByPurpose.check(root).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('entities', 'user', 'actions') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('entities', 'user', 'effects') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('entities', 'user', 'reducers') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('entities', 'user', 'sagas') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('entities', 'user', 'selectors') },
    },
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('entities', 'user', 'thunks') },
    },
  ])
})

it('reports errors on Angular-style segments', () => {
  const root = parseIntoFsdRoot(`
    📂 features
      📂 auth
        📂 model
        📂 pipes
          📄 index.ts
        📄 index.ts
  `)

  const diagnostics = segmentsByPurpose.check(root).diagnostics.sort(compareMessages)
  expect(diagnostics).toEqual([
    {
      message: "This segment's name should describe the purpose of its contents, not what the contents are.",
      location: { path: joinFromRoot('features', 'auth', 'pipes') },
    },
  ])
})
