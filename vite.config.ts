/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Project page lives at /freakingpepperoni/. Must be an absolute base (not
  // './') so assets resolve from nested routes like /recipe/:slug under
  // BrowserRouter. Drives both Vite's asset URLs and the router basename
  // (import.meta.env.BASE_URL). On a future custom domain at the root, set '/'.
  base: '/freakingpepperoni/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
})
