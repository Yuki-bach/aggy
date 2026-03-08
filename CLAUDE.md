# CLAUDE.md

## Project Overview

Aggy is a browser-based survey raw-data aggregation tool (アンケートローデータ集計システム). Users upload a CSV of survey responses and a JSON layout file, then run GT (Grand Total) and cross-tabulation — all client-side using DuckDB Wasm for SQL-based aggregation.

Tech: TypeScript (strict), Vite, Preact (JSX), DuckDB Wasm, Tailwind CSS v4.

## Commands

```bash
pnpm dev        # Vite dev server
pnpm build      # tsc + vite build
pnpm check      # fmt:check + lint + tsc --noEmit (CI validation)
pnpm test       # vitest run
pnpm lint       # oxlint
pnpm lint:fix   # oxlint --fix
pnpm fmt        # oxfmt
pnpm fmt:check  # oxfmt --check
pnpm bench      # aggregate() benchmark (all patterns)
pnpm bench rows # single pattern (rows / cols / both)
pnpm bench:gen  # generate benchmark data
```

## Architecture

- **`src/components/`** — UI: event handling and DOM rendering only
- **`src/lib/`** — Pure logic (aggregation SQL, DuckDB bridge, layout parsing, pivot, export)

## Conventions

- Data format conventions: see `docs/data-preparation-guide.md`
- Component files: PascalCase `.tsx`; lib files: camelCase `.ts`
- Module-level singleton state for infrastructure (`duckdbBridge`, `i18n`); UI state uses hooks + Context
- File ordering: `imports → exports (Public API) → internal implementation`. Props interfaces stay with their exported component
- DuckDB Wasm runs sequentially on a single Web Worker — never use `Promise.all` with `duckdbBridge` methods; call them with sequential `await`
- Prefer functional style by default. Use classes when multiple functions need shared state to avoid props drilling (e.g. `aggregateGT` — bundle related data into a class and access it via methods)
