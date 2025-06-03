import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // Ensures assets are loaded from root path
  build: {
    assetsDir: 'assets', // Place generated assets in the assets directory
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]' // Consistent asset naming
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
