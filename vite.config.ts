import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), "");

  return {
    build: {
      outDir: 'dist', // This is where Vercel will look for the static files
      sourcemap: true,
    },
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: process.env.VITE_API_BASE_URL || 'https://api-server.krontiva.africa',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy, options) => {
            // Add the auth token to the proxy headers
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.setHeader('Authorization', process.env.VITE_AUTH_TOKEN || '');
            });
          }
        },
      },
    },
    define: {
      // Ensure environment variables are properly defined
      'process.env': process.env,
      'process.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(process.env.VITE_GOOGLE_MAPS_API_KEY)
    },
    envPrefix: '', // This allows all env variables to be exposed
  };
});
