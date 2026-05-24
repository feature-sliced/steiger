import packageJson from 'eslint-plugin-package-json'
import baseConfig from '@steiger/eslint-config'

export default [...baseConfig, packageJson.configs['recommended-publishable']]
