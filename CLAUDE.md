# CLAUDE.md

## Project Overview

Aggy is a browser-based survey raw-data aggregation tool (アンケートローデータ集計システム). Users upload a CSV of survey responses and a JSON layout file, then run Grand Total and cross-tabulation — all client-side using DuckDB Wasm for SQL-based aggregation.

Tech: TypeScript (strict), VitePlus (Vite + Vitest + Oxc), Svelte 5 (SFC), DuckDB Wasm, Tailwind CSS v4.

## Monorepo Structure

pnpm workspaces monorepo with two packages:

- **`packages/lib/`** (`@aggy/lib`) — Shared pure domain logic: aggregation SQL, layout parsing, export formatters, i18n core, validation
- **`apps/web/`** (`@aggy/web`) — Browser app: Svelte UI, DuckDB Wasm bridge, OPFS storage, theme, Chart.js

## Commands

```bash
# apps/web (run from apps/web/)
vp dev          # dev server
vp build        # production build
vp check        # fmt + lint + type check
vp test run     # vitest run
pnpm e2e        # playwright E2E

# packages/lib (run from packages/lib/)
vp check        # fmt + lint + type check
vp test run     # vitest run (600+ tests)
pnpm bench      # aggregate() benchmark (all patterns)
pnpm bench rows # single pattern (rows / cols / both)
pnpm bench:gen  # generate benchmark data
```

## Architecture

- **`packages/lib/src/agg/`** — Aggregation SQL generation (aggTab, aggCrossTab, etc.)
- **`packages/lib/src/export/`** — Export formatters (CSV, TSV, JSON, Markdown)
- **`packages/lib/src/layout.ts`** — Layout schema parsing & validation
- **`packages/lib/src/i18n.ts`** — Pure i18n core (t function, locale data)
- **`apps/web/src/components/`** — UI: event handling, DOM rendering, and component-local helpers
- **`apps/web/src/lib/`** — Browser-specific: DuckDB bridge, OPFS, i18n Svelte wrapper, theme, Chart.js config

## Conventions

- Data format conventions: see `.claude/skills/aggy-import/references/data-preparation-guide.md`
- Component files: PascalCase `.svelte`; lib files: camelCase `.ts` (reactive modules use `.svelte.ts`)
- Module-level singleton state for infrastructure (`duckdb`, `i18n.svelte.ts`); UI state uses `$state` / `$derived` / `$effect`
- File ordering: `<script> → template → <style>` for Svelte SFCs. Props interfaces stay with their component
- DuckDB Wasm runs sequentially on a single Web Worker — never use `Promise.all` with `duckdb` methods; call them with sequential `await`
- Prefer functional style by default. Use classes when multiple functions need shared state to avoid props drilling (e.g. `aggGrandTotal` — bundle related data into a class and access it via methods)
- apps/web imports shared logic from `@aggy/lib` (barrel export) or `@aggy/lib/i18n`
