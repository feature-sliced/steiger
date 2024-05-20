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
import { parseIntoFsdRoot } from './prepare-test.js'

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
      '/features/comments/index.ts': {
        file: {
          path: '/features/comments/index.ts',
          type: 'file',
        },
        layerName: 'features',
        segmentName: null,
        sliceName: 'comments',
      },
      '/features/comments/ui/CommentCard.tsx': {
        file: {
          path: '/features/comments/ui/CommentCard.tsx',
          type: 'file',
        },
        layerName: 'features',
        segmentName: 'ui',
        sliceName: 'comments',
      },
      '/pages/editor/index.ts': {
        file: {
          path: '/pages/editor/index.ts',
          type: 'file',
        },
        layerName: 'pages',
        segmentName: null,
        sliceName: 'editor',
      },
      '/pages/editor/ui/Editor.tsx': {
        file: {
          path: '/pages/editor/ui/Editor.tsx',
          type: 'file',
        },
        layerName: 'pages',
        segmentName: 'ui',
        sliceName: 'editor',
      },
      '/pages/editor/ui/EditorPage.tsx': {
        file: {
          path: '/pages/editor/ui/EditorPage.tsx',
          type: 'file',
        },
        layerName: 'pages',
        segmentName: 'ui',
        sliceName: 'editor',
      },
      '/pages/editor/ui/styles.ts': {
        file: {
          path: '/pages/editor/ui/styles.ts',
          type: 'file',
        },
        layerName: 'pages',
        segmentName: 'ui',
        sliceName: 'editor',
      },
      '/shared/ui/Button.tsx': {
        file: {
          path: '/shared/ui/Button.tsx',
          type: 'file',
        },
        layerName: 'shared',
        segmentName: 'ui',
        sliceName: null,
      },
      '/shared/ui/TextField.tsx': {
        file: {
          path: '/shared/ui/TextField.tsx',
          type: 'file',
        },
        layerName: 'shared',
        segmentName: 'ui',
        sliceName: null,
      },
      '/shared/ui/index.ts': {
        file: {
          path: '/shared/ui/index.ts',
          type: 'file',
        },
        layerName: 'shared',
        segmentName: 'ui',
        sliceName: null,
      },
      '/shared/ui/styles.ts': {
        file: {
          path: '/shared/ui/styles.ts',
          type: 'file',
        },
        layerName: 'shared',
        segmentName: 'ui',
        sliceName: null,
      },
    })
  })
}
