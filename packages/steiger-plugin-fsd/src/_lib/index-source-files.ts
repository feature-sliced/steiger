import {
  getIndex,
  getLayers,
  getSegments,
  getSlices,
  isSliced,
  type File,
  type Folder,
  type LayerName,
} from '@feature-sliced/filesystem'
import { joinFromRoot, parseIntoFsdRoot } from './prepare-test.js'

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
    if (!isSliced(layer)) {
      for (const [segmentName, segment] of Object.entries(getSegments(layer))) {
        walk(segment, { layerName: layerName as LayerName, sliceName: null, segmentName })
      }
    } else {
      for (const [sliceName, slice] of Object.entries(getSlices(layer))) {
        for (const [segmentName, segment] of Object.entries(getSegments(slice))) {
          walk(segment, { layerName: layerName as LayerName, sliceName, segmentName })
        }
        const index = getIndex(slice)
        if (index !== undefined) {
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
    })
  })
}
