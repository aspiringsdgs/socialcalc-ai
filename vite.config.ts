import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    // Point at the library's source entries, not the folder: the folder's package.json
    // resolves to the published dist/ build, which is only refreshed by `npm run build`.
    alias: [
      { find: /^socialcalc(-ai)?$/, replacement: path.resolve(__dirname, "./socialcalc/index.js") },
      { find: /^socialcalc(-ai)?\/(.*)$/, replacement: path.resolve(__dirname, "./socialcalc") + "/$2" },
    ],
  },
  server: {
    proxy: {
      "/agent": {
        target: "http://127.0.0.1:5342",
        changeOrigin: true,
      },
      // Helia via Tornado. Only used when VITE_HELIA_BASE_URL is set empty (same-origin, no CORS);
      // by default the app calls http://localhost:8080 directly and relies on Tornado's CORS.
      "/meshkit-helia": {
        target: process.env.TORNADO_HELIA_PROXY_TARGET || "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      // Tornado JSON Sheets API (tornado_version). Same-origin in dev, so no CORS needed.
      "/api": {
        target: process.env.TORNADO_PROXY_TARGET || "http://127.0.0.1:8888",
        changeOrigin: true,
      },
    },
  },

  define: {
    __DATE__: `'${new Date().toISOString()}'`,
    global: "globalThis",
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    sourcemap: false,
  },
  esbuild: {
    target: "es2020",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2020",
    },
  },
});
