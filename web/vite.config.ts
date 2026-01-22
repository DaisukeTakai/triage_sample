import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages: set this to "/<repo-name>/" when deploying.
  // For local dev it can stay "/".
  base: process.env.GITHUB_PAGES_BASE ?? '/',
  plugins: [react()],
})
