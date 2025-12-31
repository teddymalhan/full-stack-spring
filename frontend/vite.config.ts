import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    proxy: {
      "/api": "http://localhost:8080",
      "/config": "http://localhost:8080",
    },
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
