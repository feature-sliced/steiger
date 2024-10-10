import type { PartialDiagnostic, Rule } from '@steiger/toolkit'
import { NAMESPACE } from '../constants.js'
import { getLayers, getSegments } from '@feature-sliced/filesystem'

const noUiInApp = {
  name: `${NAMESPACE}/no-ui-in-app`,
  check(root) {
    const diagnostics: Array<PartialDiagnostic> = []

    const layers = getLayers(root)

    if (layers.app !== undefined) {
      const segments = getSegments(layers.app)

      if (segments.ui !== undefined) {
        diagnostics.push({
          message: 'Layer "app" should not have "ui" segment.',
          location: { path: segments.ui.path },
        })
      }
    }

    return { diagnostics }
  },
} satisfies Rule

export default noUiInApp
