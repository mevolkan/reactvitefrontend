import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Dev proxy so the browser talks to the backend same-origin (no CORS setup needed).
  const backend = env.BACKEND_URL ?? 'http://localhost:8000'
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    server: { port: 5173, proxy: { '/api': backend } },
  }
})
