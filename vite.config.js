import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api-server.krontiva.africa',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api:uEBBwbSs')
      }
    }
  }
}); 