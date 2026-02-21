import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import path from "path";

export default defineConfig({
  plugins: [wasm(), topLevelAwait()],
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
  resolve: {
    alias: {
      "@ruby/wasm-wasi/browser": path.resolve(
        __dirname,
        "node_modules/@ruby/wasm-wasi/dist/esm/browser.js"
      ),
    },
  },
  optimizeDeps: {
    exclude: ["@ruby/3.3-wasm-wasi"],
  },
});
