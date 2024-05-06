import path from 'node:path'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { packageDirectorySync } from 'pkg-dir'

const packageRoot = packageDirectorySync()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'src': path.resolve(packageRoot, './src'),
    },
  },
})
