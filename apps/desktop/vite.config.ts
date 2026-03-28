/// <reference types="vite-plus" />
import { resolve } from "node:path";
import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  resolve: {
    alias: {
      "@aggy/lib/i18n": resolve(import.meta.dirname, "../../packages/lib/src/i18n.ts"),
      "@aggy/lib/changelog": resolve(import.meta.dirname, "../../packages/lib/src/changelog.ts"),
      "@aggy/lib/agg/naHelpers": resolve(
        import.meta.dirname,
        "../../packages/lib/src/agg/naHelpers.ts",
      ),
      "@aggy/lib": resolve(import.meta.dirname, "../../packages/lib/src/index.ts"),
      "@aggy/ui": resolve(import.meta.dirname, "../../packages/ui/src/index.ts"),
    },
  },
  // Tauri dev server configuration
  clearScreen: false,
  server: {
    port: 5174, // Use 5174 to avoid conflict with apps/web (5173)
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 5174,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? ("esbuild" as const) : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
  fmt: {
    semi: true,
    singleQuote: false,
    tabWidth: 2,
    useTabs: false,
    printWidth: 100,
    trailingComma: "all",
    arrowParens: "always",
    bracketSpacing: true,
    endOfLine: "lf",
  },
  lint: {
    plugins: ["typescript", "import", "unicorn"],
    categories: {
      correctness: "error",
      suspicious: "warn",
      perf: "warn",
    },
    env: {
      browser: true,
    },
    ignorePatterns: ["dist/", "node_modules/", "src-tauri/"],
    rules: {
      "typescript/no-unnecessary-type-assertion": "error",
      "no-console": "warn",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: "error",
      "typescript/no-explicit-any": "error",
      "import/no-duplicates": "error",
      "typescript/no-deprecated": "warn",
      "typescript/triple-slash-reference": "off",
      "typescript/no-misused-promises": "off",
      "import/no-named-as-default": "off",
      "typescript/no-unsafe-type-assertion": "off",
      "unicorn/no-array-sort": "off",
    },
    overrides: [
      {
        files: ["**/*.svelte"],
        rules: {
          "prefer-const": "off",
          "no-unassigned-vars": "off",
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  plugins: [tailwindcss(), svelte()],
  optimizeDeps: {
    exclude: ["@duckdb/duckdb-wasm"],
  },
});
