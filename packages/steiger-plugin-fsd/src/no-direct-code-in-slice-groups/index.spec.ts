import { describe, expect, it } from 'vitest'

import noDirectCodeInSliceGroups from './index.js'
import { compareMessages, joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'

function fileMessage(group: string) {
  return `Files should not be placed directly inside the slice group "${group}". Move this file into a slice.`
}

function segmentMessage(segment: string, group: string) {
  return `Conventional segment "${segment}" should not be placed directly inside the slice group "${group}". Move this segment into a slice.`
}

function crossImportMessage(group: string) {
  return `Cross-import public API "@x" should not be placed directly inside the slice group "${group}". Move it into the slice it belongs to.`
}

describe('no-direct-code-in-slice-groups rule', () => {
  it('does not report a project without slice groups', () => {
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 entities
        📂 user
          📂 ui
            📄 Name.tsx
          📂 api
            📄 useCurrentUser.ts
          📄 index.ts
      📂 features
        📂 post
          📂 model
            📄 store.ts
          📂 analytics
            📄 track.ts
          📄 index.ts
      📂 pages
        📂 home
          📂 ui
            📄 HomePage.tsx
          📄 index.ts
    `)

    expect(noDirectCodeInSliceGroups.check(root)).toEqual({ diagnostics: [] })
  })

  it('does not report valid slice groups, including nested groups', () => {
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 features
        📂 post
          📂 compose
            📂 ui
              📄 Compose.tsx
            📄 index.ts
          📂 like
            📂 ui
              📄 Like.tsx
            📄 index.ts
          📂 reactions
            📂 emoji
              📂 ui
                📄 Emoji.tsx
              📄 index.ts
            📂 sticker
              📂 model
                📄 sticker.ts
              📄 index.ts
      📂 pages
        📂 home
          📂 ui
            📄 HomePage.tsx
          📄 index.ts
    `)

    expect(noDirectCodeInSliceGroups.check(root)).toEqual({ diagnostics: [] })
  })

  it('does not report slices with conventional and custom segments as groups', () => {
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 features
        📂 post
          📂 model
            📄 store.ts
          📂 ui
            📄 Post.tsx
          📂 compose
            📄 compose.ts
            📄 index.ts
          📂 like
            📄 like.ts
          📄 index.ts
          📄 constants.ts
    `)

    expect(noDirectCodeInSliceGroups.check(root)).toEqual({ diagnostics: [] })
  })

  it('does not report groups with only one detectable slice', () => {
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 features
        📂 post
          📂 model
            📄 store.ts
          📂 compose
            📂 ui
              📄 Compose.tsx
            📄 index.ts
          📄 index.ts
    `)

    expect(noDirectCodeInSliceGroups.check(root)).toEqual({ diagnostics: [] })
  })

  it('does not report empty or non-slice child folders', () => {
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 features
        📂 post
          📄 index.ts
          📂 compose
          📂 like
        📂 comment
          📄 helpers.ts
          📂 create
            📄 create.ts
          📂 delete
            📄 delete.ts
    `)

    expect(noDirectCodeInSliceGroups.check(root)).toEqual({ diagnostics: [] })
  })

  it('ignores unsliced layers, including prefixed layers', () => {
    const root = parseIntoFsdRoot(`
      📂 6_shared
        📄 index.ts
        📂 model
          📄 store.ts
        📂 routes
          📂 home
            📂 ui
              📄 Home.tsx
          📂 about
            📂 ui
              📄 About.tsx
      📂 app
        📄 index.ts
        📂 ui
          📄 App.tsx
        📂 providers
          📂 theme
            📂 ui
              📄 ThemeProvider.tsx
          📂 router
            📂 config
              📄 routes.ts
    `)

    expect(noDirectCodeInSliceGroups.check(root)).toEqual({ diagnostics: [] })
  })

  it('skips segment-named folders directly under sliced layers', () => {
    // `features/ui` has the shape of a slice group, but its `index.ts` is not reported here
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 features
        📂 ui
          📄 index.ts
          📂 compose
            📂 ui
              📄 Compose.tsx
            📄 index.ts
          📂 like
            📂 ui
              📄 Like.tsx
            📄 index.ts
        📂 model
          📂 api
            📄 model.ts
          📄 index.ts
    `)

    expect(noDirectCodeInSliceGroups.check(root)).toEqual({ diagnostics: [] })
  })

  it('does not count @x as slice evidence', () => {
    // `@x/model` looks like a slice, so if `@x` counted, `media` would be a slice group and `media/index.ts` would be reported
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 entities
        📂 user
          📂 model
            📄 user.ts
          📂 @x
            📄 post.ts
          📄 index.ts
        📂 media
          📄 index.ts
          📂 image
            📂 model
              📄 image.ts
            📄 index.ts
          📂 @x
            📂 model
              📄 video.ts
    `)

    expect(noDirectCodeInSliceGroups.check(root)).toEqual({ diagnostics: [] })
  })

  it('reports @x placed directly in a slice group', () => {
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 entities
        📂 content
          📂 post
            📂 model
              📄 post.ts
            📂 @x
              📄 comment.ts
            📄 index.ts
          📂 comment
            📂 model
              📄 comment.ts
            📄 index.ts
          📂 @x
            📄 user.ts
    `)

    expect(noDirectCodeInSliceGroups.check(root).diagnostics).toEqual([
      { message: crossImportMessage('content'), location: { path: joinFromRoot('entities', 'content', '@x') } },
    ])
  })

  it('does not treat file segments as slice evidence', () => {
    // Custom segments like `charts` and `table` often have a `config.ts`. `isSlice` would call them slices,
    // and `dashboard` would then look like a slice group with a misplaced `index.ts` and `model`
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 features
        📂 dashboard
          📄 index.ts
          📂 model
            📄 store.ts
          📂 charts
            📄 config.ts
            📄 Chart.tsx
          📂 table
            📄 config.ts
            📄 Table.tsx
    `)

    expect(noDirectCodeInSliceGroups.check(root)).toEqual({ diagnostics: [] })
  })

  it('documents a known false positive for slices whose custom segments contain segment folders', () => {
    // `editor` and `preview` are meant as custom segments, but look like slices.
    // `article` has no code of its own, so only `post/index.ts` and `post/model` are reported.
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 features
        📂 article
          📂 editor
            📂 ui
              📄 Editor.tsx
          📂 preview
            📂 ui
              📄 Preview.tsx
        📂 post
          📄 index.ts
          📂 model
            📄 store.ts
          📂 editor
            📂 ui
              📄 Editor.tsx
          📂 preview
            📂 ui
              📄 Preview.tsx
    `)

    const diagnostics = noDirectCodeInSliceGroups.check(root).diagnostics.sort(compareMessages)
    expect(diagnostics).toEqual(
      [
        { message: fileMessage('post'), location: { path: joinFromRoot('features', 'post', 'index.ts') } },
        { message: segmentMessage('model', 'post'), location: { path: joinFromRoot('features', 'post', 'model') } },
      ].sort(compareMessages),
    )
  })

  it('reports group-shaped tooling folders on a layer but ignores them inside slices', () => {
    // On a layer, `features/__fixtures__` has the shape of a slice group, and other rules already treat `foo` and `bar` as slices
    // (`public-api` asks them for an index), so `setup.ts` is reported. Inside a slice, the same folder is left alone.
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 features
        📂 __fixtures__
          📄 setup.ts
          📂 foo
            📂 ui
              📄 Foo.tsx
          📂 bar
            📂 ui
              📄 Bar.tsx
        📂 post
          📄 index.ts
          📂 ui
            📄 Post.tsx
          📂 __fixtures__
            📄 setup.ts
            📂 foo
              📂 ui
                📄 Foo.tsx
            📂 bar
              📂 ui
                📄 Bar.tsx
    `)

    expect(noDirectCodeInSliceGroups.check(root).diagnostics).toEqual([
      {
        message: fileMessage('__fixtures__'),
        location: { path: joinFromRoot('features', '__fixtures__', 'setup.ts') },
      },
    ])
  })

  it('does not look for slice groups inside slices', () => {
    // `editor` has the shape of a slice group, but one piece of evidence is not enough to make `post` a group.
    // `post` stays a slice, so `editor/index.ts` is not reported
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 features
        📂 post
          📄 index.ts
          📂 ui
            📄 Post.tsx
          📂 editor
            📄 index.ts
            📂 toolbar
              📂 ui
                📄 Toolbar.tsx
            📂 canvas
              📂 ui
                📄 Canvas.tsx
    `)

    expect(noDirectCodeInSliceGroups.check(root)).toEqual({ diagnostics: [] })
  })

  it('reports files and segments placed directly in a slice group (issue #265)', () => {
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 features
        📂 post
          📄 index.ts
          📂 model
            📄 store.ts
          📂 compose
            📂 ui
              📄 Compose.tsx
            📄 index.ts
          📂 like
            📂 ui
              📄 Like.tsx
            📄 index.ts
    `)

    const diagnostics = noDirectCodeInSliceGroups.check(root).diagnostics.sort(compareMessages)
    expect(diagnostics).toEqual(
      [
        { message: fileMessage('post'), location: { path: joinFromRoot('features', 'post', 'index.ts') } },
        { message: segmentMessage('model', 'post'), location: { path: joinFromRoot('features', 'post', 'model') } },
      ].sort(compareMessages),
    )
  })

  it('reports a misplaced segment even when isSlice classifies the group as a slice', () => {
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 features
        📂 post
          📂 model
            📄 store.ts
          📂 compose
            📂 ui
              📄 Compose.tsx
            📄 index.ts
          📂 like
            📂 ui
              📄 Like.tsx
            📄 index.ts
    `)

    expect(noDirectCodeInSliceGroups.check(root).diagnostics).toEqual([
      { message: segmentMessage('model', 'post'), location: { path: joinFromRoot('features', 'post', 'model') } },
    ])
  })

  it('reports every invalid direct child while leaving custom-named folders alone', () => {
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 features
        📂 post
          📄 index.ts
          📄 helpers.ts
          📄 styles.css
          📄 schema.json
          📄 README.md
          📄 .gitkeep
          📂 ui
            📄 Post.tsx
          📂 api
            📄 fetchPost.ts
          📂 lib
            📄 format.ts
          📂 model
            📄 store.ts
          📂 config
            📄 flags.ts
          📂 analytics
            📄 track.ts
          📂 compose
            📂 ui
              📄 Compose.tsx
            📄 index.ts
          📂 like
            📂 ui
              📄 Like.tsx
            📄 index.ts
    `)

    const post = (...segments: Array<string>) => joinFromRoot('features', 'post', ...segments)
    const diagnostics = noDirectCodeInSliceGroups.check(root).diagnostics.sort(compareMessages)
    expect(diagnostics).toEqual(
      [
        { message: fileMessage('post'), location: { path: post('index.ts') } },
        { message: fileMessage('post'), location: { path: post('helpers.ts') } },
        { message: fileMessage('post'), location: { path: post('styles.css') } },
        { message: fileMessage('post'), location: { path: post('schema.json') } },
        { message: fileMessage('post'), location: { path: post('README.md') } },
        { message: fileMessage('post'), location: { path: post('.gitkeep') } },
        { message: segmentMessage('ui', 'post'), location: { path: post('ui') } },
        { message: segmentMessage('api', 'post'), location: { path: post('api') } },
        { message: segmentMessage('lib', 'post'), location: { path: post('lib') } },
        { message: segmentMessage('model', 'post'), location: { path: post('model') } },
        { message: segmentMessage('config', 'post'), location: { path: post('config') } },
      ].sort(compareMessages),
    )
  })

  it('reports code in nested slice groups', () => {
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 pages
        📂 post
          📄 index.ts
          📂 list
            📂 ui
              📄 PostList.tsx
            📄 index.ts
          📂 detail
            📂 ui
              📄 PostDetail.tsx
            📄 index.ts
          📂 editor
            📂 lib
              📄 shared.ts
            📂 create
              📂 ui
                📄 Create.tsx
              📄 index.ts
            📂 edit
              📂 ui
                📄 Edit.tsx
              📄 index.ts
    `)

    const diagnostics = noDirectCodeInSliceGroups.check(root).diagnostics.sort(compareMessages)
    expect(diagnostics).toEqual(
      [
        { message: fileMessage('post'), location: { path: joinFromRoot('pages', 'post', 'index.ts') } },
        {
          message: segmentMessage('lib', 'editor'),
          location: { path: joinFromRoot('pages', 'post', 'editor', 'lib') },
        },
      ].sort(compareMessages),
    )
  })

  it('uses a nested slice group as evidence for its parent group', () => {
    // `social` has only one slice, `profile`. The slice group `post` is the second piece of evidence
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 features
        📂 social
          📄 index.ts
          📂 post
            📂 model
              📄 store.ts
            📂 compose
              📂 ui
                📄 Compose.tsx
              📄 index.ts
            📂 like
              📂 ui
                📄 Like.tsx
              📄 index.ts
          📂 profile
            📂 ui
              📄 Profile.tsx
            📄 index.ts
    `)

    const diagnostics = noDirectCodeInSliceGroups.check(root).diagnostics.sort(compareMessages)
    expect(diagnostics).toEqual(
      [
        { message: fileMessage('social'), location: { path: joinFromRoot('features', 'social', 'index.ts') } },
        {
          message: segmentMessage('model', 'post'),
          location: { path: joinFromRoot('features', 'social', 'post', 'model') },
        },
      ].sort(compareMessages),
    )
  })

  it('finds slice groups through non-slice wrapper folders', () => {
    // `social` contains only one slice group, which is not enough to make `social` a slice group, so `social/index.ts` is not reported
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 index.ts
      📂 features
        📂 social
          📄 index.ts
          📂 post
            📂 model
              📄 store.ts
            📂 compose
              📂 ui
                📄 Compose.tsx
              📄 index.ts
            📂 like
              📂 ui
                📄 Like.tsx
              📄 index.ts
    `)

    expect(noDirectCodeInSliceGroups.check(root).diagnostics).toEqual([
      {
        message: segmentMessage('model', 'post'),
        location: { path: joinFromRoot('features', 'social', 'post', 'model') },
      },
    ])
  })

  it('reports code in slice groups on prefixed sliced layers', () => {
    const root = parseIntoFsdRoot(`
      📂 6_shared
        📂 ui
          📄 index.ts
      📂 3_features
        📂 post
          📄 index.ts
          📂 compose
            📂 ui
              📄 Compose.tsx
            📄 index.ts
          📂 like
            📂 ui
              📄 Like.tsx
            📄 index.ts
    `)

    expect(noDirectCodeInSliceGroups.check(root).diagnostics).toEqual([
      { message: fileMessage('post'), location: { path: joinFromRoot('3_features', 'post', 'index.ts') } },
    ])
  })
})
