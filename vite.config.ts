import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Cross-origin isolation: SharedArrayBuffer (multi-thread solver) needs both headers.
const isolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

// Same CSP as vercel.json, for `vite preview` only: the dev server needs inline scripts and a websocket for hot reload.
const csp =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: { headers: isolation },
  preview: { headers: { ...isolation, 'Content-Security-Policy': csp } },
  worker: { format: 'es' },
  build: { target: 'esnext' },
  optimizeDeps: { exclude: ['solver'] },
})
