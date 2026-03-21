# CLAUDE.md

## Project Overview

Aggy is a browser-based survey raw-data aggregation tool (アンケートローデータ集計システム). Users upload a CSV of survey responses and a JSON layout file, then run Grand Total and cross-tabulation — all client-side using DuckDB Wasm for SQL-based aggregation.

Tech: TypeScript (strict), VitePlus (Vite + Vitest + Oxc), Preact (JSX), DuckDB Wasm, Tailwind CSS v4.

## Commands

```bash
vp dev          # dev server
vp build        # production build
vp check        # fmt + lint + type check
vp test run     # vitest run
vp test         # vitest watch
vp fmt          # oxfmt
vp lint         # oxlint
pnpm bench      # aggregate() benchmark (all patterns)
pnpm bench rows # single pattern (rows / cols / both)
pnpm bench:gen  # generate benchmark data
```

## Architecture

- **`src/components/`** — UI: event handling, DOM rendering, and component-local helpers
- **`src/lib/`** — Shared pure logic used by multiple modules (aggregation SQL, DuckDB bridge, layout parsing, pivot, export)

## Conventions

- Data format conventions: see `.claude/skills/aggy-import/references/data-preparation-guide.md`
- Component files: PascalCase `.tsx`; lib files: camelCase `.ts`
- Module-level singleton state for infrastructure (`duckdb`, `i18n`); UI state uses hooks + Context
- File ordering: `imports → exports (Public API) → internal implementation`. Props interfaces stay with their exported component
- DuckDB Wasm runs sequentially on a single Web Worker — never use `Promise.all` with `duckdb` methods; call them with sequential `await`
- Prefer functional style by default. Use classes when multiple functions need shared state to avoid props drilling (e.g. `aggGrandTotal` — bundle related data into a class and access it via methods)
