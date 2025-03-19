import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api-server.krontiva.africa',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api:uEBBwbSs'),
        secure: false,
      },
    }
  },
  define: {
    // Ensure environment variables are properly defined
    'process.env': process.env
  },
  envPrefix: '', // This allows all env variables to be exposed
});
