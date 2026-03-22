/// <reference types="vite-plus" />
import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
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
    plugins: ["typescript", "import", "unicorn", "react", "vitest"],
    categories: {
      correctness: "error",
      suspicious: "warn",
      perf: "warn",
    },
    env: {
      browser: true,
    },
    ignorePatterns: ["dist/", "node_modules/", "testdata/"],
    rules: {
      // --- core ---
      "no-unused-vars": "error",
      "no-console": "warn",
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "error",

      // --- typescript ---
      "typescript/no-explicit-any": "error",
      "typescript/triple-slash-reference": "off",

      // --- type-aware (require typeAware: true) ---
      "typescript/no-floating-promises": "error",
      "typescript/no-misused-promises": "off",
      "typescript/await-thenable": "error",
      "typescript/no-unnecessary-type-assertion": "error",

      // --- import ---
      "import/no-duplicates": "error",
      "import/no-named-as-default": "off",

      // --- react (Preact compat) ---
      "react/no-unknown-property": "off",
      "react/react-in-jsx-scope": "off",

      // --- project-specific overrides ---
      "no-await-in-loop": "off", // DuckDB Wasm requires sequential await (see CLAUDE.md)
      "typescript/no-unsafe-type-assertion": "off", // too noisy; no-explicit-any covers main concern
      "unicorn/no-array-sort": "off", // [...arr].sort() pattern is safe
    },
    overrides: [
      {
        files: ["scripts/**/*.ts", "bench/**/*.ts", ".claude/skills/**/*.mjs"],
        rules: {
          "no-console": "off",
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
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
