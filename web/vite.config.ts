import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Built into ../static/app and served by our Flask app (app.py) on IBM LinuxONE.
// In development (`npm run dev`), API calls are forwarded to the Flask app on port 38889.
const FLASK = 'http://127.0.0.1:38889'

// https://vite.dev/config/
export default defineConfig({
  base: '/static/app/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  build: {
    outDir: '../static/app',
    emptyOutDir: true,
  },
  server: {
    proxy: { '/api': FLASK, '/demo-messages': FLASK, '/pay': FLASK },
  },
})
