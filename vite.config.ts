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
      // --- promotion: category default → error ---
      "typescript/no-unnecessary-type-assertion": "error", // suspicious → error

      // --- enable: not in any active category ---
      "no-console": "warn", // restriction
      "no-var": "error", // restriction
      "prefer-const": "error", // style
      eqeqeq: "error", // pedantic
      "typescript/no-explicit-any": "error", // restriction
      "import/no-duplicates": "error", // style

      // --- disable: category-enabled but too noisy / incompatible ---
      "typescript/triple-slash-reference": "off", // correctness; used in ambient declarations
      "typescript/no-misused-promises": "off", // pedantic; too noisy for Preact JSX attributes
      "import/no-named-as-default": "off", // suspicious; false positives with Preact lazy()
      "react/no-unknown-property": "off", // restriction; Preact supports standard HTML attrs
      "react/react-in-jsx-scope": "off", // suspicious; Preact auto-injects JSX runtime
      "no-await-in-loop": "off", // perf; DuckDB Wasm requires sequential await
      "typescript/no-unsafe-type-assertion": "off", // suspicious; too noisy
      "unicorn/no-array-sort": "off", // suspicious; [...arr].sort() pattern is safe
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
