import { getIndexes, getLayers, getSegments, getSlices, isSliced, type LayerName } from '@feature-sliced/filesystem'
import type { File, Folder } from '@steiger/toolkit'
import { joinFromRoot, parseIntoFolder as parseIntoFsdRoot } from '@steiger/toolkit/test'

type SourceFile = {
  file: File
  layerName: LayerName
  sliceName: string | null
  segmentName: string | null
}

/**
 * Walk the folder as an FSD root and create an index of all existing source files along with their layer, slice, and segment.
 *
 * @returns A mapping of source file paths to their file object and location information.
 */
export function indexSourceFiles(root: Folder): Record<string, SourceFile> {
  const index = {} as Record<string, SourceFile>
  function walk(node: File | Folder, metadata: Pick<SourceFile, 'layerName' | 'sliceName' | 'segmentName'>) {
    if (node.type === 'file') {
      index[node.path] = { ...metadata, file: node }
    } else {
      for (const child of node.children) {
        walk(child, metadata)
      }
    }
  }

  for (const [layerName, layer] of Object.entries(getLayers(root))) {
    // Even though files that are directly inside a layer are not encouraged by the FSD and are forbidden in most cases
    // (except for an index/root file for the app layer as an entry point to the application), users can still add them.
    // So, we need to index all files directly inside a layer to find errors.
    layer.children
      .filter((child) => child.type === 'file')
      .forEach((file) => walk(file, { layerName: layerName as LayerName, sliceName: null, segmentName: null }))

    if (!isSliced(layer)) {
      for (const [segmentName, segment] of Object.entries(getSegments(layer))) {
        walk(segment, { layerName: layerName as LayerName, sliceName: null, segmentName })
      }
    } else {
      for (const [sliceName, slice] of Object.entries(getSlices(layer))) {
        for (const [segmentName, segment] of Object.entries(getSegments(slice))) {
          walk(segment, { layerName: layerName as LayerName, sliceName, segmentName })
        }
        const indexes = getIndexes(slice)

        for (const index of indexes) {
          walk(index, { layerName: layerName as LayerName, sliceName, segmentName: null })
        }
      }
    }
  }

  return index
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest
  test('indexSourceFiles', () => {
    const root = parseIntoFsdRoot(`
      📂 shared
        📂 ui
          📄 styles.ts
          📄 Button.tsx
          📄 TextField.tsx
          📄 index.ts
      📂 features
        📂 comments
          📂 ui
            📄 CommentCard.tsx
          📄 index.ts
      📂 pages
        📂 editor
          📂 ui
            📄 styles.ts
            📄 EditorPage.tsx
            📄 Editor.tsx
          📄 index.ts
      📂 app
        📂 ui
          📄 index.ts
        📄 root.ts
        📄 index.ts
    `)

    expect(indexSourceFiles(root)).toEqual({
      [joinFromRoot('features', 'comments', 'index.ts')]: {
        file: {
          path: joinFromRoot('features', 'comments', 'index.ts'),
          type: 'file',
        },
        layerName: 'features',
        segmentName: null,
        sliceName: 'comments',
      },
      [joinFromRoot('features', 'comments', 'ui', 'CommentCard.tsx')]: {
        file: {
          path: joinFromRoot('features', 'comments', 'ui', 'CommentCard.tsx'),
          type: 'file',
        },
        layerName: 'features',
        segmentName: 'ui',
        sliceName: 'comments',
      },
      [joinFromRoot('pages', 'editor', 'index.ts')]: {
        file: {
          path: joinFromRoot('pages', 'editor', 'index.ts'),
          type: 'file',
        },
        layerName: 'pages',
        segmentName: null,
        sliceName: 'editor',
      },
      [joinFromRoot('pages', 'editor', 'ui', 'Editor.tsx')]: {
        file: {
          path: joinFromRoot('pages', 'editor', 'ui', 'Editor.tsx'),
          type: 'file',
        },
        layerName: 'pages',
        segmentName: 'ui',
        sliceName: 'editor',
      },
      [joinFromRoot('pages', 'editor', 'ui', 'EditorPage.tsx')]: {
        file: {
          path: joinFromRoot('pages', 'editor', 'ui', 'EditorPage.tsx'),
          type: 'file',
        },
        layerName: 'pages',
        segmentName: 'ui',
        sliceName: 'editor',
      },
      [joinFromRoot('pages', 'editor', 'ui', 'styles.ts')]: {
        file: {
          path: joinFromRoot('pages', 'editor', 'ui', 'styles.ts'),
          type: 'file',
        },
        layerName: 'pages',
        segmentName: 'ui',
        sliceName: 'editor',
      },
      [joinFromRoot('shared', 'ui', 'Button.tsx')]: {
        file: {
          path: joinFromRoot('shared', 'ui', 'Button.tsx'),
          type: 'file',
        },
        layerName: 'shared',
        segmentName: 'ui',
        sliceName: null,
      },
      [joinFromRoot('shared', 'ui', 'TextField.tsx')]: {
        file: {
          path: joinFromRoot('shared', 'ui', 'TextField.tsx'),
          type: 'file',
        },
        layerName: 'shared',
        segmentName: 'ui',
        sliceName: null,
      },
      [joinFromRoot('shared', 'ui', 'index.ts')]: {
        file: {
          path: joinFromRoot('shared', 'ui', 'index.ts'),
          type: 'file',
        },
        layerName: 'shared',
        segmentName: 'ui',
        sliceName: null,
      },
      [joinFromRoot('shared', 'ui', 'styles.ts')]: {
        file: {
          path: joinFromRoot('shared', 'ui', 'styles.ts'),
          type: 'file',
        },
        layerName: 'shared',
        segmentName: 'ui',
        sliceName: null,
      },
      [joinFromRoot('app', 'ui', 'index.ts')]: {
        file: {
          path: joinFromRoot('app', 'ui', 'index.ts'),
          type: 'file',
        },
        layerName: 'app',
        segmentName: 'ui',
        sliceName: null,
      },
      [joinFromRoot('app', 'root.ts')]: {
        file: {
          path: joinFromRoot('app', 'root.ts'),
          type: 'file',
        },
        layerName: 'app',
        segmentName: 'root',
        sliceName: null,
      },
      [joinFromRoot('app', 'index.ts')]: {
        file: {
          path: joinFromRoot('app', 'index.ts'),
          type: 'file',
        },
        layerName: 'app',
        segmentName: null,
        sliceName: null,
      },
    })
  })
}
