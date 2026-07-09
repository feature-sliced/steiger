import type { PartialDiagnostic, Rule } from '@steiger/toolkit'
import { NAMESPACE } from '../constants.js'
import { getLayers, getSegments } from '@feature-sliced/filesystem'
import type { FsdRuleOptions } from '../fsd-options.js'

const noUiInApp = {
  name: `${NAMESPACE}/no-ui-in-app` as const,
  check(root, ruleOptions: FsdRuleOptions = {}) {
    const diagnostics: Array<PartialDiagnostic> = []

    const layers = getLayers(root, ruleOptions.layerConvention)

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
} satisfies Rule<unknown, FsdRuleOptions>

export default noUiInApp
