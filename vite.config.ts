/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [tailwindcss(), preact()],
  define: {
    "import.meta.vitest": "undefined",
  },
  test: {
    pool: "forks",
    exclude: ["e2e/**", "node_modules/**"],
    includeSource: ["src/**/*.ts"],
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  build: {
    target: "esnext",
  },
  optimizeDeps: {
    exclude: ["@duckdb/duckdb-wasm"],
  },
});
