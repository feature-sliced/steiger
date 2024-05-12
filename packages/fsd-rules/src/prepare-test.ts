import type { FsdRoot, Segment, Slice, SlicedLayer, UnslicedLayer } from '@feature-sliced/filesystem'

/**
 * Parse a multi-line indented string with emojis for files and folders into an FSD root.
 *
 * @example
 * const markup = `
 * 📂 shared
 *   📂 ui
 *     📄 index.ts
 *   📂 lib
 *     📄 index.ts
 * 📂 entities
 *   📂 user
 *     📂 ui
 *     📂 model
 *     📄 index.ts
 * 📂 pages
 *   📂 home
 *     📂 ui
 *     📄 index.ts
 * `
 *
 * const root = parseIntoFsdRoot(markup);
 * console.log(root);
 * // {
 * //   type: 'root',
 * //   path: '.',
 * //   layers: {
 * //     shared: {
 * //       name: 'shared',
 * //       type: 'unsliced-layer',
 * //       path: './shared',
 * //       segments: {
 * //         ui: {
 * //           type: 'segment',
 * //           name: 'ui',
 * //           path: './shared/ui',
 * //           index: './shared/ui/index.ts',
 * //         },
 * //         model: {
 * //           type: 'segment',
 * //           name: 'lib',
 * //           path: './shared/lib',
 * //           index: './shared/lib/index.ts',
 * //         },
 * //       },
 * //     },
 * //     entities: {
 * //       name: 'entities',
 * //       type: 'sliced-layer',
 * //       path: './entities',
 * //       slices: {
 * //         user: {
 * //           type: 'slice',
 * //           name: 'user',
 * //           path: './entities/user',
 * //           index: './entities/user/index.ts',
 * //           segments: {
 * //             ui: {
 * //               type: 'segment',
 * //               name: 'ui',
 * //               path: './entities/user/ui',
 * //               index: null,
 * //             },
 * //             model: {
 * //               type: 'segment',
 * //               name: 'model',
 * //               path: './entities/user/model',
 * //               index: null,
 * //             },
 * //           },
 * //         },
 * //       },
 * //     },
 * //     features: null,
 * //     widgets: null,
 * //     pages: {
 * //       name: 'pages',
 * //       type: 'sliced-layer',
 * //       path: './pages',
 * //       slices: {
 * //         home: {
 * //           type: 'slice',
 * //           name: 'home',
 * //           path: './pages/home',
 * //           index: './pages/home/index.ts',
 * //           segments: {
 * //             ui: {
 * //               type: 'segment',
 * //               name: 'ui',
 * //               path: './pages/home/ui',
 * //               index: null,
 * //             },
 * //           },
 * //         },
 * //       },
 * //     },
 * //     app: null,
 * //   },
 * //  }
 */
export function parseIntoFsdRoot(fsMarkup: string): FsdRoot {
  const lines = fsMarkup
    .split('\n')
    .filter(Boolean)
    .map((line, _i, lines) => line.slice(lines[0].search(/\S/)))
    .filter(Boolean)

  const root: FsdRoot = {
    type: 'root',
    path: '.',
    layers: {
      shared: null,
      entities: null,
      features: null,
      widgets: null,
      pages: null,
      app: null,
    },
  }

  const linesForLayers = lines.reduce<Array<Array<string>>>((acc, line) => {
    if (line.startsWith('📂 ')) {
      acc.push([line])
    } else {
      acc[acc.length - 1].push(line)
    }
    return acc
  }, [])

  for (const [layerLine, ...otherLines] of linesForLayers) {
    const layerName = layerLine.slice('📂 '.length).trim()
    if (['shared', 'app'].includes(layerName)) {
      const segments = parseAsSegments(
        otherLines.map((line) => line.slice('  '.length)),
        `./${layerName}`,
      )

      const layer: UnslicedLayer = {
        name: layerName as UnslicedLayer['name'],
        type: 'unsliced-layer',
        path: `./${layerName}`,
        segments,
      }
      root.layers[layerName] = layer
    } else {
      const slices = parseAsSlices(
        otherLines.map((line) => line.slice('  '.length)),
        `./${layerName}`,
      )
      const layer: SlicedLayer = {
        name: layerName as SlicedLayer['name'],
        type: 'sliced-layer',
        path: `./${layerName}`,
        slices,
      }
      root.layers[layerName] = layer
    }
  }

  return root
}

function parseAsSegments(lines: string[], pathPrefix: string): Record<string, Segment> {
  const segments: Record<string, Segment> = {}

  const linesForSegments = lines.reduce<Array<Array<string>>>((acc, line) => {
    if (line.startsWith('📄 ')) {
      return acc
    }

    if (line.startsWith('📂 ')) {
      acc.push([line])
    } else {
      acc[acc.length - 1].push(line)
    }
    return acc
  }, [])

  for (const [segmentLine, ...otherLines] of linesForSegments) {
    const segmentName = segmentLine.slice('📂 '.length).trim()
    segments[segmentName] = {
      type: 'segment',
      name: segmentName,
      path: `${pathPrefix}/${segmentName}`,
      index: otherLines.some((line) => line === '  📄 index.ts') ? `${pathPrefix}/${segmentName}/index.ts` : null,
    }
  }

  return segments
}

function parseAsSlices(lines: string[], pathPrefix: string): Record<string, Slice> {
  const slices: Record<string, Slice> = {}

  const linesForSlices = lines.reduce<Array<Array<string>>>((acc, line) => {
    if (line.startsWith('📂 ')) {
      acc.push([line])
    } else {
      acc[acc.length - 1].push(line)
    }
    return acc
  }, [])

  for (const [sliceLine, ...otherLines] of linesForSlices) {
    const sliceName = sliceLine.slice('📂 '.length).trim()
    const segments = parseAsSegments(
      otherLines.map((line) => line.slice('  '.length)),
      `${pathPrefix}/${sliceName}`,
    )

    slices[sliceName] = {
      type: 'slice',
      name: sliceName,
      path: `${pathPrefix}/${sliceName}`,
      index: otherLines.some((line) => line === '  📄 index.ts') ? `${pathPrefix}/${sliceName}/index.ts` : null,
      segments,
    }
  }

  return slices
}
