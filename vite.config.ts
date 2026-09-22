import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      socialcalc: path.resolve(__dirname, "./socialcalc"),
      "socialcalc-ai": path.resolve(__dirname, "./socialcalc"),
    },
  },
  server: {
    proxy: {
      "/agent": {
        target: "http://127.0.0.1:5342",
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
