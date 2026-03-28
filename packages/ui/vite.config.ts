/// <reference types="vite-plus" />
import { resolve } from "node:path";
import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  resolve: {
    alias: {
      "@aggy/lib/i18n": resolve(import.meta.dirname, "../../packages/lib/src/i18n.ts"),
      "@aggy/lib/agg/naHelpers": resolve(
        import.meta.dirname,
        "../../packages/lib/src/agg/naHelpers.ts",
      ),
      "@aggy/lib/changelog": resolve(
        import.meta.dirname,
        "../../packages/lib/src/changelog.ts",
      ),
      "@aggy/lib": resolve(import.meta.dirname, "../../packages/lib/src/index.ts"),
    },
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
    ignorePatterns: ["dist/", "node_modules/"],
    rules: {
      "typescript/no-unnecessary-type-assertion": "error",
      "no-console": "warn",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: "error",
      "typescript/no-explicit-any": "error",
      "import/no-duplicates": "error",
      "typescript/no-deprecated": "warn",
      "typescript/prefer-includes": "warn",
      "typescript/prefer-function-type": "warn",
      "prefer-object-has-own": "warn",
      "unicorn/prefer-array-flat": "warn",
      "unicorn/prefer-dom-node-append": "warn",
      "unicorn/prefer-query-selector": "warn",
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
});
