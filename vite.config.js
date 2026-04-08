import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { compression } from 'vite-plugin-compression2'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    compression({ algorithm: 'gzip' }),
    compression({ algorithm: 'brotliCompress', filename: '[path][base].br' }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Split vendor chunks so browser can cache them separately
        manualChunks(id) {
          if (id.includes('react-dom') || id.includes('react/')) return 'vendor'
          if (id.includes('react-router')) return 'router'
        },
      },
    },
    // Vite 8 uses oxc minifier by default
    minify: true,
    // Inline small assets as base64 to save requests
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
  },
})
