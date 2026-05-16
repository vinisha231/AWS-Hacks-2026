import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Split vendor chunks so returning users hit cache instead of re-downloading
    rollupOptions: {
      output: {
        manualChunks: {
          react:  ['react', 'react-dom'],
          router: ['react-router-dom'],
          store:  ['zustand'],
        }
      }
    },
    // Warn if any chunk exceeds 200kb — keeps low-bandwidth load times fast
    chunkSizeWarningLimit: 200,
    // Minify with esbuild (default, fast and effective)
    minify: 'esbuild',
    // Generate source maps for debugging without shipping them to users
    sourcemap: false,
  },
  server: {
    // Compress responses in dev too
    headers: { 'Cache-Control': 'public, max-age=31536000' }
  }
})
