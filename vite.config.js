import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: '/src/embed.jsx',
      output: {
        entryFileNames: 'epower-funnel.js',   // nome fisso = comodo in Liquid
        assetFileNames: 'epower-funnel.[ext]'
      }
    }
  }
})
