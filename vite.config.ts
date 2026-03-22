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
    plugins: ["typescript", "import", "unicorn", "react", "vitest", "jsx-a11y"],
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
      "typescript/no-deprecated": "warn", // restriction; catch deprecated API usage

      // --- prefer-* (autofix): modern idioms ---
      // typescript
      "typescript/prefer-includes": "warn",
      "typescript/prefer-function-type": "warn",
      "typescript/prefer-reduce-type-parameter": "warn",
      "typescript/prefer-return-this-type": "warn",
      "typescript/prefer-ts-expect-error": "warn",
      // eslint
      // "prefer-destructuring": "warn", // disabled: 41 unfixable warnings, too noisy
      "prefer-exponentiation-operator": "warn",
      "prefer-numeric-literals": "warn",
      "prefer-object-has-own": "warn",
      "prefer-object-spread": "warn",
      // unicorn
      "unicorn/prefer-array-flat": "warn",
      "unicorn/prefer-array-some": "warn",
      "unicorn/prefer-code-point": "warn",
      "unicorn/prefer-date-now": "warn",
      "unicorn/prefer-dom-node-append": "warn",
      "unicorn/prefer-dom-node-dataset": "warn",
      "unicorn/prefer-dom-node-text-content": "warn",
      "unicorn/prefer-keyboard-event-key": "warn",
      "unicorn/prefer-math-min-max": "warn",
      "unicorn/prefer-negative-index": "warn",
      "unicorn/prefer-number-properties": "warn",
      "unicorn/prefer-optional-catch-binding": "warn",
      "unicorn/prefer-prototype-methods": "warn",
      "unicorn/prefer-query-selector": "warn",
      "unicorn/prefer-regexp-test": "warn",
      "unicorn/prefer-spread": "warn",
      "unicorn/prefer-string-raw": "warn",
      "unicorn/prefer-string-replace-all": "warn",
      "unicorn/prefer-string-slice": "warn",
      "unicorn/prefer-string-trim-start-end": "warn",
      "unicorn/prefer-classlist-toggle": "warn",
      "unicorn/prefer-bigint-literals": "warn",
      "unicorn/prefer-class-fields": "warn",
      // vitest
      "vitest/prefer-called-once": "warn",
      "vitest/prefer-called-times": "warn",
      "vitest/prefer-describe-function-title": "warn",
      "vitest/prefer-expect-type-of": "warn",
      "vitest/prefer-import-in-mock": "warn",
      "vitest/prefer-to-be-object": "warn",

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
