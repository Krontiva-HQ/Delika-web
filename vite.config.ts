import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), "");

  return {
    build: {
      outDir: "dist",
      sourcemap: true,
    },
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          // Real API URL is only visible during development
          target: 'https://api-server.krontiva.africa',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api:uEBBwbSs'),
          secure: false,
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
