import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['epubjs', 'jszip'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          epubjs: ['epubjs'],
          jszip: ['jszip'],
          react: ['react', 'react-dom'],
        }
      }
    }
  }
});