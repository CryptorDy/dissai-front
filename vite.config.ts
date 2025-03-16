import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  define: {
    global: 'window'
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://cryptordy-aidiscussion-9bff.twc1.net',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
