import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Custom domain served at the root (dragonselysees.com) — base stays '/'.
  base: '/',
  build: {
    rollupOptions: {
      // Three installable PWAs = three real HTML entries (customer / admin / kitchen).
      // Customer keeps the full HashRouter app; admin/kitchen mount a single panel each.
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        kitchen: resolve(__dirname, 'kitchen.html'),
      },
    },
  },
})
