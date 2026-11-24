import { expect, it } from 'vitest'
import { createFsdPlugin, type FSDPluginOptions } from './index.js'

it.each(['', ' ', 'features/bridge', 'features\\bridge', 'bridge.ts', 'index', '@x'])(
  'rejects %j as an additional segment name',
  (name) => {
    expect(() => createFsdPlugin({ additionalSegments: [name] })).toThrow(TypeError)
  },
)

it('rejects a string in place of the additional segment names array', () => {
  const options = { additionalSegments: 'bridge' } as unknown as FSDPluginOptions

  expect(() => createFsdPlugin(options)).toThrow(TypeError)
})
