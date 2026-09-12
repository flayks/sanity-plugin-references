import pluginKitOxlint from '@sanity/plugin-kit/oxlint'
import {defineConfig} from 'oxlint'

const rules = {...pluginKitOxlint.rules}
delete (rules as Record<string, unknown>)['react/react-compiler']

export default defineConfig({
  ...pluginKitOxlint,
  rules,
})
