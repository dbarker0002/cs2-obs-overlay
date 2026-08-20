import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        customizer: resolve(import.meta.dirname, "index.html"),
        test: resolve(import.meta.dirname, "test/index.html"),
        widget: resolve(import.meta.dirname, "widget/index.html"),
      },
    },
  },
});
