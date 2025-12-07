import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  base: "/",

  server: {
    proxy: {
      "/api": "http://localhost:8080",
    },
  },

  build: {
    outDir: resolve(__dirname, "../backend/src/main/resources/static"),
    emptyOutDir: true,
  },
});
