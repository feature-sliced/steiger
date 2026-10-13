import packageJson from 'eslint-plugin-package-json'
import baseConfig from '@steiger/eslint-config'

export default [{ ignores: ['bin/'] }, ...baseConfig, packageJson.configs['recommended-publishable']]
